# Kubernetes API Flask Application

This is a Flask application that hosts a Kubernetes API. It can currently fetch information about pods, namespaces, and persistent volumes (PVs) along with their corresponding persistent volume claims (PVCs).

## Features

- **Fetch Pods**: Retrieve and display a list of pods. Each pod is displayed as a clickable link that takes you to the pod's details page.
- **Fetch Namespaces**: Retrieve and display a list of namespaces.
- **Fetch Persistent Volumes**: Retrieve and display a list of persistent volumes and their corresponding PVCs.

## Usage

The application is hosted on port `5000`.

### Endpoints

- `/api/v1/namespaces`: Fetches a list of namespaces.
- `/api/v1/persistentvolumes`: Fetches a list of persistent volumes.
- `/api/v1/nodes`: Fetches a list of nodes.
- `/api/v1/cluster-info`: Fetches cluster information.

### Running the Application

To run the application locally:

1. **Install Dependencies**:
    ```sh
    pip install -r requirements.txt
    ```

2. **Start the Flask Server**:
    ```sh
    flask run --host=0.0.0.0 --port=5000
    ```

### Docker

You can also run the application using Docker.

1. **Build the Docker Image**:
    ```sh
    docker build -t my-flask-app .
    ```

2. **Run the Docker Container**:
    ```sh
    docker run -p 5000:5000 my-flask-app
    ```

# **Run the Docker Container without building**:
    ```sh
    docker run -p 5000:5000 filipdadgar/fdk8api
    ```

## Development

### Prerequisites

- Python 3.9+
- Flask
- Kubernetes Python Client

### Setting Up the Development Environment

1. **Clone the Repository**:
    ```sh
    git clone https://github.com/yourusername/your-repo.git
    cd your-repo
    ```

2. **Create a Virtual Environment**:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. **Install Dependencies**:
    ```sh
    pip install -r requirements.txt
    ```

4. **Run the Application**:
    ```sh
    flask run
    ```
    or
    ```sh
    python main.py
    ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.