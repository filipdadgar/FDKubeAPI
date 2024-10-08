import os
from flask import Flask, request, jsonify, render_template
from kubernetes import client, config
from kubernetes.client import VersionApi
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['KUBECONFIG_PATH'] = os.path.join(app.config['UPLOAD_FOLDER'], 'kubeconfig')
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True

def set_kube_api_server_from_kubeconfig(kubeconfig_path):
    config.load_kube_config(config_file=kubeconfig_path)
    configuration = client.Configuration.get_default_copy()
    api_server = configuration.host
    if not api_server.startswith('http'):
        api_server = 'https://' + api_server
    os.environ['KUBE_API_SERVER'] = api_server

def get_service_loadbalancer_ip(namespace, pod_name):
    v1 = client.CoreV1Api()
    services = v1.list_namespaced_service(namespace=namespace)
    for service in services.items:
        # Check if the service selector matches the pod labels
        if service.spec.selector and all(item in pod_name.items() for item in service.spec.selector.items()):
            if service.status.load_balancer and service.status.load_balancer.ingress:
                return service.status.load_balancer.ingress[0].ip
    return None

@app.route('/')
def index():
    kubeconfig_exists = os.path.exists(app.config['KUBECONFIG_PATH'])
    if kubeconfig_exists:
        set_kube_api_server_from_kubeconfig(app.config['KUBECONFIG_PATH'])
    return render_template('index.html', kubeconfig_exists=kubeconfig_exists)


@app.route('/upload_kubeconfig', methods=['POST'])
def upload_kubeconfig():
    if 'kubeconfig' in request.files:
        file = request.files['kubeconfig']
        if file.filename != '':
            filename = secure_filename(file.filename)
            upload_folder = app.config['UPLOAD_FOLDER']
            filepath = app.config['KUBECONFIG_PATH']

            # Ensure the upload directory exists
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)

            file.save(filepath)
            set_kube_api_server_from_kubeconfig(filepath)
            return jsonify({"success": True})
    return jsonify({"success": False}), 400

@app.route('/pod_description.html')
def pod_description():
    return render_template('pod_description.html')

@app.route('/api/v1/cluster-info', methods=['GET'])
def get_cluster_info():
    # Use VersionApi to get the server version
    version_api = VersionApi()
    version_info = version_api.get_code()
    server_version = version_info.git_version

    # Use CoreV1Api to get the cluster name
    v1 = client.CoreV1Api()
    cluster_name = v1.get_api_resources().group_version

    cluster_info = {
        'server_version': server_version,
    }
    return jsonify(cluster_info)

# Get the list of pods in default namespace using the kube-api-server
@app.route('/api/v1/namespaces/<namespace>/pods', methods=['GET'])
def get_pods(namespace):
    # Use k8 client to get the list of pods
    v1 = client.CoreV1Api()
    pods = v1.list_namespaced_pod(namespace=namespace)
    pod_list = []
    for pod in pods.items:
        pod_info = {
            'name': pod.metadata.name,
            'namespace': pod.metadata.namespace,
            'status': pod.status.phase,
            'ip': pod.status.pod_ip,
                        'service_loadbalancer_ip': get_service_loadbalancer_ip(namespace, pod.metadata.labels)
        }
        pod_list.append(pod_info)
    return jsonify({'items': pod_list})

@app.route('/api/v1/namespaces', methods=['GET'])
def get_namespaces():
    # Use k8 client to get the list of namespaces
    v1 = client.CoreV1Api()
    namespaces = v1.list_namespace()
    namespace_list = [ns.metadata.name for ns in namespaces.items]
    return jsonify({'items': namespace_list})

# Get the list of nodes using the kube-api-server
@app.route('/api/v1/nodes', methods=['GET'])
def get_nodes():
    # Use k8 client to get the list of nodes
    v1 = client.CoreV1Api()
    nodes = v1.list_node()
    node_list = []
    for node in nodes.items:
        node_info = {
            'name': node.metadata.name,
            'capacity': node.status.capacity,
            'allocatable': node.status.allocatable,
            'node_info': node.status.node_info.to_dict()  # Convert V1NodeSystemInfo to dictionary
        }
        node_list.append(node_info)
    return jsonify({'items': node_list})

@app.route('/api/v1/namespaces/<namespace>/pods/<pod_name>', methods=['GET'])
def get_pod_description(namespace, pod_name):
    # Use k8 client to get the pod description
    v1 = client.CoreV1Api()
    pod = v1.read_namespaced_pod(name=pod_name, namespace=namespace)
    return jsonify(pod.to_dict())

# Get the current PV's and PVC's using the kube-api-server
@app.route('/api/v1/persistentvolumes', methods=['GET'])
def get_persistentvolumes():
    # Use k8 client to get the list of persistentvolumes
    v1 = client.CoreV1Api()
    persistentvolumes = v1.list_persistent_volume()
    persistentvolume_list = []
    for persistentvolume in persistentvolumes.items:
        persistentvolume_info = {
            'name': persistentvolume.metadata.name,
            'capacity': persistentvolume.spec.capacity['storage'] if 'storage' in persistentvolume.spec.capacity else 'N/A',
            'pvc_name': persistentvolume.spec.claim_ref.name if persistentvolume.spec.claim_ref else 'N/A'
        }
        persistentvolume_list.append(persistentvolume_info)  # Append to the list
    return jsonify({'items': persistentvolume_list})

@app.route('/events.html')
def events():
    return render_template('events.html')

@app.route('/api/v1/events', methods=['GET'])
def get_events():
    v1 = client.CoreV1Api()
    events = v1.list_event_for_all_namespaces()
    event_list = []
    for event in events.items:
        event_info = {
            'type': event.type,
            'reason': event.reason,
            'message': event.message,
            'timestamp': event.last_timestamp
        }
        event_list.append(event_info)
    return jsonify({'items': event_list})

@app.route('/api/v1/namespaces/<namespace>/pods/<pod_name>/restart', methods=['POST'])
def restart_pod(namespace, pod_name):
    v1 = client.CoreV1Api()
    try:
        v1.delete_namespaced_pod(name=pod_name, namespace=namespace)
        return jsonify({"success": True})
    except client.exceptions.ApiException as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/v1/namespaces/<namespace>/pods/<pod_name>/scale', methods=['POST'])
def scale_pod(namespace, pod_name):
    v1 = client.AppsV1Api()
    try:
        body = {
            "spec": {
                "replicas": 0
            }
        }
        v1.patch_namespaced_deployment_scale(name=pod_name, namespace=namespace, body=body)
        return jsonify({"success": True})
    except client.exceptions.ApiException as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    if os.path.exists(app.config['KUBECONFIG_PATH']):
        set_kube_api_server_from_kubeconfig(app.config['KUBECONFIG_PATH'])
    app.run(host='0.0.0.0', port=5000, debug=True)