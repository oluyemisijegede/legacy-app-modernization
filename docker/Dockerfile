FROM node:18

WORKDIR /app

COPY app/package.json .

RUN npm install

COPY app/ .
COPY monitoring/ ./monitoring/

EXPOSE 3000

CMD ["node", "server.js"]