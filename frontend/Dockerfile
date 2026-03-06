FROM node:20-bullseye-slim 
# This is the Long term support version; thats
# why i'm not using node 25 - too new

WORKDIR /app

COPY package*.json ./
# . = > /app like the curr working dir

RUN npm ci

COPY . .
#  copy everything from this src => dest

EXPOSE 3000
# default port for next.js i believe 

# RUN npm run dev 
CMD [ "npm", "run", "dev"]
# I added to the package.json 0.0.0.0 ip to scripts dev
# in prod its best to use npm start; we could use npm start now and
# volume mount the main code files/all files for hot reload 

# build this image
# docker build -t frontend:dev .
# docker build -t <name>:<tag> <path>
# docker build --no-cache -t frontend:dev .

# run this image as a container
# docker run -d --name frontend -p 3000:3000 frontend:dev

# enter container (sh not bash; node:20 alpine doesn't include bash by default just sh )
# docker exec -it frontend sh 
