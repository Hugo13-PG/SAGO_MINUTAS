# Etapa 1: compilar TypeScript
FROM node:20-alpine AS build
WORKDIR /app

# Dependencias (incluye devDependencies para poder compilar)
COPY package.json package-lock.json ./
RUN npm ci

# Codigo fuente y contrato
COPY tsconfig.json ./
COPY src ./src
COPY openapi.yaml ./openapi.yaml

# Genera dist/
RUN npm run build

# Etapa 2: imagen final de ejecucion
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Solo dependencias de produccion
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Artefactos necesarios en runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/openapi.yaml ./openapi.yaml

EXPOSE 3000
CMD ["node", "dist/server.js"]