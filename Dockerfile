# Etapa 1: Build
FROM node:22.12.0-alpine AS build
WORKDIR /app

# Instalamos dependencias primero para aprovechar la caché de Docker
COPY package*.json ./
RUN npm ci

# Copiamos el resto y construimos
COPY . .
RUN npm run build

# Etapa 2: Producción con Nginx
FROM nginx:alpine


COPY --from=build /app/dist /usr/share/nginx/html

# Copiamos nuestra config de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]