FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --silent
COPY . .
RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "start"]
