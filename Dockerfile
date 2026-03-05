# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código e gerar build do frontend
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copiar apenas o necessário do estágio de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/mac-server.ts ./mac-server.ts

# Expor a porta 4000 (ou o que estiver configurado no PORT)
EXPOSE 4000

# Variável de ambiente padrão
ENV NODE_ENV=production
ENV PORT=4000

# Executar o servidor usando tsx (já que o mac-server é .ts)
# Nota: tsx precisa estar no node_modules copiado
CMD ["npm", "run", "mac-app"]
