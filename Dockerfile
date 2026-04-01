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

# ¡OJO! Verifica que esta ruta coincida con tu carpeta de salida en 'dist'
# Algunos Angular modernos generan 'dist/[nombre-app]/browser'
COPY --from=build /app/dist/generador-de-rutinas-de-gimnasio-ai/browser /usr/share/nginx/html

# Copiamos nuestra config de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]