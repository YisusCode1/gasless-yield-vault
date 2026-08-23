// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GasslessPilotVault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// --- Mocks para simular el ecosistema Aave en tests locales ---

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether USD", "mUSDt") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }
}

contract MockAToken is ERC20 {
    address public pool;

    constructor() ERC20("Mock aToken", "maUSDt") {}

    function setPool(address _pool) external {
        pool = _pool;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == pool, "solo el pool puede mintear");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == pool, "solo el pool puede quemar");
        _burn(from, amount);
    }
}

contract MockAavePool is IAavePool {
    IERC20 public underlying;
    MockAToken public aToken;

    constructor(IERC20 _underlying, MockAToken _aToken) {
        underlying = _underlying;
        aToken = _aToken;
    }

    function supply(address, uint256 amount, address onBehalfOf, uint16) external override {
        underlying.transferFrom(msg.sender, address(this), amount);
        aToken.mint(onBehalfOf, amount);
    }

    function withdraw(address, uint256 amount, address to) external override returns (uint256) {
        aToken.burn(msg.sender, amount);
        underlying.transfer(to, amount);
        return amount;
    }
}

contract GasslessPilotVaultTest is Test {
    GasslessPilotVault public vault;
    MockUSDT public asset;
    MockAToken public aToken;
    MockAavePool public aavePool;

    address public owner = address(1);
    address public treasury = address(3);
    address public user = address(4);

    function setUp() public {
        asset = new MockUSDT();
        aToken = new MockAToken();
        aavePool = new MockAavePool(asset, aToken);
        aToken.setPool(address(aavePool));

        vm.prank(owner);
        vault = new GasslessPilotVault(
            asset,
            treasury,
            address(aavePool),
            address(aToken)
        );

        // Fondear al usuario con 10,000 USDt
        asset.transfer(user, 10_000 * 10 ** 18);
    }

    function test_InitialState() public view {
        assertEq(vault.name(), "GasslessPilot Vault Share");
        assertEq(vault.symbol(), "ypVault");
        assertEq(vault.treasury(), treasury);
        assertEq(address(vault.aavePool()), address(aavePool));
        assertEq(vault.aToken(), address(aToken));
        assertEq(vault.targetAllocationBps(), 10000);
    }

    function test_DepositAndAutoSupply() public {
        uint256 depositAmount = 1_000 * 10 ** 18;

        vm.startPrank(user);
        asset.approve(address(vault), depositAmount);
        uint256 shares = vault.deposit(depositAmount, user);
        vm.stopPrank();

        assertEq(shares, depositAmount);
        assertEq(vault.balanceOf(user), depositAmount);
        assertEq(vault.totalAssets(), depositAmount);
        // Todo fue desplegado a Aave (aToken en el vault)
        assertEq(aToken.balanceOf(address(vault)), depositAmount);
    }

    function test_WithdrawFromAave() public {
        uint256 depositAmount = 1_000 * 10 ** 18;

        vm.startPrank(user);
        asset.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user);

        uint256 withdrawAmount = 500 * 10 ** 18;
        vault.withdraw(withdrawAmount, user, user);
        vm.stopPrank();

        assertEq(vault.totalAssets(), depositAmount - withdrawAmount);
        assertEq(asset.balanceOf(user), 10_000 * 10 ** 18 - withdrawAmount);
    }

    function test_SetTargetAllocation() public {
        vm.prank(owner);
        vault.setTargetAllocation(8000);
        assertEq(vault.targetAllocationBps(), 8000);
    }
}
