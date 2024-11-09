# Designli technical challenge

## Running the project

### Requirements

To run the project, you will only need to have Docker installed on your machine. If you don't have it installed, you can download it [here](https://www.docker.com/products/docker-desktop).

### Setup environment variables

Before running the project, you need to create a `.env` file in the root directory of the project. You can copy the `.env.example` file and rename it to `.env`. The `.env` file should contain the following environment variables:

```env
DB_PASSWORD=your_password
DATABASE_URL=postgres://postgres:your_password@localhost:5432/db
REDIS_PASSWORD=your_password
```

### Running the project

After installing Docker, you can run the project by executing the following command in the root directory of the project:

```bash
docker-compose up
```

This command will build the Docker image and start the container. The project will be available at `http://localhost:3000`.
