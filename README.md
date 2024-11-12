# Designli technical challenge

## Running the project

### Requirements

To run the project, you will only need to have Docker installed on your machine. If you don't have it installed, you can download it [here](https://www.docker.com/products/docker-desktop).

### Setup environment variables

Before running the project, you need to create a `.env` file in the root directory of the project. You can copy the `.env.example` file and rename it to `.env`. The `.env` file should contain the following environment variables:

```env
DB_PASSWORD=your_password
DATABASE_URL=postgres://postgres:your_password@localhost:5432/backend
REDIS_PASSWORD=your_password
```

> [!IMPORTANT]
> There is no need to deploy a PostgreSQL or Redis server. The project uses Docker to create containers for these services.

### Running the project

After installing Docker, you can run the project by executing the following command in the root directory of the project:

```bash
docker compose up
```

This command will build the Docker image and start the container. The project will be available at `http://localhost:3000`.


### TODO

- [x] Create a new project using the NestJS framework.
- [x] Create a RESTful API that allows users to create, read, update, and delete a user.
- [x] Create a RESTful API that allows users to create, read, update, and delete a Product.
- [x] Create authentication middleware that checks if the user is authenticated before allowing them to access the API.
- [x] Create authorization middleware that checks if the user has the correct permissions before allowing them to access the API.
- [x] Add Orders logic to the project.
- [x] Add Websockets to the project.
- [x] Add job queues to simulate payment jobs.
- [ ] Add Cache layer to the project.
- [ ] Add Unit tests to the project.
- [ ] Add Integration tests to the project.
- [x] Create a Dockerfile to build the project.
- [x] Create a docker-compose file to run the project.
- [ ] Create Documentation for the project.
