# Etapa 1: Construcción
FROM node:22.12.0-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# Etapa 2: Servidor de producción (Nginx)
FROM nginx:alpine
# Ajusta la ruta 'dist/generador-de-rutinas-de-gimnasio-ai/browser' 
# si tu Angular compila en otra carpeta (mira tu angular.json)
COPY --from=build /app/dist/generador-de-rutinas-de-gimnasio-ai/browser /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]