// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GasslessPilotVault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Token ERC20 simple para simular el asset (ej. USDC) y el aToken
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @notice Mock del Pool de Aave V3: simula supply/withdraw moviendo el asset hacia/desde el aToken
contract MockAavePool {
    MockERC20 public asset;
    MockERC20 public aToken;

    constructor(MockERC20 _asset, MockERC20 _aToken) {
        asset = _asset;
        aToken = _aToken;
    }

    function supply(address _asset, uint256 amount, address onBehalfOf, uint16) external {
        require(_asset == address(asset), "Asset invalido");
        asset.transferFrom(msg.sender, address(this), amount);
        aToken.mint(onBehalfOf, amount);
    }

    function withdraw(address _asset, uint256 amount, address to) external returns (uint256) {
        require(_asset == address(asset), "Asset invalido");
        // Simula quemar el aToken del vault y devolver el asset
        aToken.transferFrom(msg.sender, address(this), amount);
        asset.transfer(to, amount);
        return amount;
    }

    /// @dev Helper de test: simula que Aave genera yield transfiriendo asset extra al pool
    function simulateYield(address vault, uint256 amount) external {
        asset.mint(address(this), amount);
        aToken.mint(vault, amount);
    }
}

contract GasslessPilotVaultTest is Test {
    GasslessPilotVault public vault;
    MockERC20 public asset;
    MockERC20 public aToken;
    MockAavePool public aavePool;

    address public owner = address(this);
    address public treasury = makeAddr("treasury");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    uint256 constant INITIAL_BALANCE = 10_000e6; // 10,000 USDC (6 decimales)

    function setUp() public {
        asset = new MockERC20("USD Coin", "USDC", 6);
        aToken = new MockERC20("Aave USDC", "aUSDC", 6);
        aavePool = new MockAavePool(asset, aToken);

        vault = new GasslessPilotVault(
            IERC20(address(asset)),
            treasury,
            address(aavePool),
            address(aToken)
        );

        // El mock de Aave necesita poder mover el aToken de vuelta cuando se hace withdraw
        vm.prank(address(vault));
        aToken.approve(address(aavePool), type(uint256).max);

        asset.mint(user1, INITIAL_BALANCE);
        asset.mint(user2, INITIAL_BALANCE);

        vm.prank(user1);
        asset.approve(address(vault), type(uint256).max);
        vm.prank(user2);
        asset.approve(address(vault), type(uint256).max);
    }

    function test_DeployParams() public {
        assertEq(address(vault.aavePool()), address(aavePool));
        assertEq(vault.aToken(), address(aToken));
        assertEq(vault.treasury(), treasury);
        assertEq(vault.targetAllocationBps(), 10000);
    }

    function test_DepositDeploysToAave() public {
        uint256 depositAmount = 1_000e6;

        vm.prank(user1);
        vault.deposit(depositAmount, user1);

        // Con targetAllocationBps = 100%, todo deberia estar en Aave (aToken)
        assertEq(aToken.balanceOf(address(vault)), depositAmount);
        assertEq(asset.balanceOf(address(vault)), 0);
        assertEq(vault.totalAssets(), depositAmount);
        assertEq(vault.balanceOf(user1), depositAmount); // 1:1 en el primer deposito
    }

    function test_PartialAllocation() public {
        vm.prank(owner);
        vault.setTargetAllocation(5000); // 50%

        uint256 depositAmount = 1_000e6;
        vm.prank(user1);
        vault.deposit(depositAmount, user1);

        assertEq(aToken.balanceOf(address(vault)), 500e6);
        assertEq(asset.balanceOf(address(vault)), 500e6);
        assertEq(vault.totalAssets(), depositAmount);
    }

    function test_WithdrawPullsFromAave() public {
        uint256 depositAmount = 1_000e6;

        vm.prank(user1);
        vault.deposit(depositAmount, user1);

        vm.prank(user1);
        vault.withdraw(depositAmount, user1, user1);

        assertEq(asset.balanceOf(user1), INITIAL_BALANCE);
        assertEq(vault.totalAssets(), 0);
    }

    function test_MultipleUsersProportionalShares() public {
        vm.prank(user1);
        vault.deposit(1_000e6, user1);

        vm.prank(user2);
        vault.deposit(2_000e6, user2);

        assertEq(vault.balanceOf(user1), 1_000e6);
        assertEq(vault.balanceOf(user2), 2_000e6);
        assertEq(vault.totalAssets(), 3_000e6);
    }

    function test_CollectPerformanceFee() public {
        uint256 depositAmount = 1_000e6;
        vm.prank(user1);
        vault.deposit(depositAmount, user1);

        // Simula que Aave genero 100 USDC de yield
        uint256 yieldAmount = 100e6;
        aavePool.simulateYield(address(vault), yieldAmount);

        uint256 treasurySharesBefore = vault.balanceOf(treasury);

        vm.prank(owner);
        vault.collectPerformanceFee();

        // performanceFee default = 10% (1000 bps) sobre el profit de 100 USDC = 10 USDC en shares
        assertGt(vault.balanceOf(treasury), treasurySharesBefore);
    }

    function test_OnlyOwnerCanSetFee() public {
        vm.prank(user1);
        vm.expectRevert();
        vault.setPerformanceFee(500);
    }

    function test_FeeCannotExceedMax() public {
        vm.prank(owner);
        vm.expectRevert("Comision supera el maximo");
        vault.setPerformanceFee(2001);
    }

    function test_OnlyOwnerCanRebalance() public {
        vm.prank(user1);
        vm.expectRevert();
        vault.rebalance(0, 0);
    }

    function test_SetTreasuryUpdatesAddress() public {
        address newTreasury = makeAddr("newTreasury");

        vm.prank(owner);
        vault.setTreasury(newTreasury);

        assertEq(vault.treasury(), newTreasury);
    }

    function test_RevertOnZeroTreasury() public {
        vm.prank(owner);
        vm.expectRevert("Direccion invalida");
        vault.setTreasury(address(0));
    }
}
