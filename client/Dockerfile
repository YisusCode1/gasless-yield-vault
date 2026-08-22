FROM node:18-alpine

WORKDIR /app

# Copia e instala dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto por defecto de Vite
EXPOSE 5173

# Comando para levantar el servidor de desarrollo exponiéndolo a la red de Docker
CMD ["npm", "run", "dev", "--", "--host"]
