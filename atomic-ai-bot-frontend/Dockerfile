FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ARG VITE_SERVER_URL
ARG VITE_WIDGET_SCRIPT_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_WIDGET_SCRIPT_URL=$VITE_WIDGET_SCRIPT_URL

RUN npm run build


FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]