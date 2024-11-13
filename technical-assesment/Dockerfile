ARG NODE_VERSION=21.7.1

FROM node:${NODE_VERSION}
WORKDIR /usr/src/app

COPY *.lock ./

RUN apt-get update && apt-get install -y curl
RUN yarn

COPY . .
RUN npx prisma generate
RUN yarn build

EXPOSE 3000

CMD [ "node", "dist/src/main.js" ]