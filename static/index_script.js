
let isExpanded = false;
let isPVsVisible = false;

function togglePVs() {
    const pvsTable = document.getElementById('pvsTable');
    const togglePVsButton = document.getElementById('togglePVsButton');

    if (isPVsVisible) {
        pvsTable.style.display = 'none';
        togglePVsButton.textContent = 'Show Persistent Volumes';
        isPVsVisible = false;
    } else {
        pvsTable.style.display = 'table';
        togglePVsButton.textContent = 'Hide Persistent Volumes';
        isPVsVisible = true;
    }
}

function togglePods() {
    const podsTable = document.getElementById('podsTable');
    const toggleButton = document.getElementById('toggleButton');

    if (isExpanded) {
        podsTable.style.display = 'none';
        toggleButton.textContent = 'Get Pods';
        isExpanded = false;
    } else {
        fetchPods();
        podsTable.style.display = 'table';
        toggleButton.textContent = 'Collapse Pod List';
        isExpanded = true;
    }
}

function fetchPods() {
    const namespace = document.getElementById('namespaceSelect').value;
    fetch(`/api/v1/namespaces/${namespace}/pods`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const podsTable = document.getElementById('podsTable').getElementsByTagName('tbody')[0];
            podsTable.innerHTML = ''; // Clear existing rows
            data.items.forEach(pod => {
                const row = podsTable.insertRow();
                const nameCell = row.insertCell(0);
                const namespaceCell = row.insertCell(1);
                const statusCell = row.insertCell(2);
                const ipCell = row.insertCell(3);
                const loadBalancerCell = row.insertCell(4);
                const actionsCell = row.insertCell(5);

                const podLink = document.createElement('a');
                podLink.href = `pod_description.html?namespace=${pod.namespace}&pod_name=${pod.name}`;
                podLink.textContent = pod.name;

                nameCell.appendChild(podLink);
                namespaceCell.textContent = pod.namespace;
                statusCell.textContent = pod.status;
                ipCell.textContent = pod.ip;
                loadBalancerCell.textContent = pod.service_loadbalancer_ip || 'N/A';
                
                const restartButton = document.createElement('button');
                restartButton.textContent = 'Restart';
                restartButton.className = 'restart-button';
                restartButton.onclick = () => restartPod(pod.namespace, pod.name);

                const scaleButton = document.createElement('button');
                scaleButton.textContent = 'Scale to 0';
                scaleButton.className = 'scale-button';
                scaleButton.onclick = () => scalePod(pod.namespace, pod.name);

                actionsCell.appendChild(restartButton);
                actionsCell.appendChild(scaleButton);
            });
        })
        .catch(error => console.error('Error fetching pods:', error));
}

function fetchClusterInfo() {
    fetch('/api/v1/cluster-info')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const clusterInfo = document.getElementById('clusterInfo');
            clusterInfo.textContent = `Version: ${data.server_version}`;
        })
        .catch(error => console.error('Error fetching cluster info:', error));
}

function fetchNamespaces() {
    fetch('/api/v1/namespaces')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const namespaceSelect = document.getElementById('namespaceSelect');
            data.items.forEach(ns => {
                const option = document.createElement('option');
                option.value = ns;
                option.textContent = ns;
                namespaceSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching namespaces:', error));
}

function fetchNodeInfo() {
    fetch('/api/v1/nodes')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const nodesTable = document.getElementById('nodesTable').getElementsByTagName('tbody')[0];
            nodesTable.innerHTML = ''; // Clear existing rows
            data.items.forEach(node => {
                const row = nodesTable.insertRow();
                const nameCell = row.insertCell(0);
                const cpuCell = row.insertCell(1);
                const memoryCell = row.insertCell(2);
                const nodeInfoCell = row.insertCell(3);

                const cpu = node.capacity.cpu;
                const memory = (parseInt(node.capacity.memory) / 1024 / 1024).toFixed(2) + ' MiB';
                const nodeInfo = `OS: ${node.node_info.os_image}, Kernel: ${node.node_info.kernel_version}`;

                nameCell.textContent = node.name;
                cpuCell.textContent = cpu;
                memoryCell.textContent = memory;
                nodeInfoCell.textContent = nodeInfo;
            });
            document.getElementById('nodesTable').style.display = 'table';
        })
        .catch(error => console.error('Error fetching node info:', error));
}

function fetchPersistentVolumes() {
fetch('/api/v1/persistentvolumes')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Fetched Persistent Volumes:', data); // Log the fetched data

        // Check if data.items exists and is an array
        if (!data.items || !Array.isArray(data.items)) {
            console.error('Invalid data structure:', data);
            return;
        }

        const pvsTable = document.getElementById('pvsTable').getElementsByTagName('tbody')[0];
        pvsTable.innerHTML = ''; // Clear existing rows

        data.items.forEach(pv => {
            console.log('Processing PV:', pv); // Log each PV object

            const row = pvsTable.insertRow();
            const nameCell = row.insertCell(0);
            const capacityCell = row.insertCell(1);
            const pvcCell = row.insertCell(2);


            nameCell.textContent = pv.name;
            capacityCell.textContent = pv.capacity;
            pvcCell.textContent = pv.pvc_name;

            console.log('Added row:', { name: pv.name, capacity: pv.capacity, pvc: pv.pvc_name }); // Log each added row
        });

        // Display the table even if there are no items
        //document.getElementById('pvsTable').style.display = 'table';
    })
    .catch(error => {
        console.error('Error fetching persistent volumes:', error);
        // Optionally, display an error message in the UI
    });
}

function uploadKubeconfig() {
    const fileInput = document.getElementById('kubeconfig-file');
    const file = fileInput.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('kubeconfig', file);

        fetch('/upload_kubeconfig', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                 sessionStorage.setItem('kubeconfigUploaded', 'true'); // Set flag in sessionStorage
                 document.getElementById('kubeconfig-upload').style.display = 'none';
                 document.getElementById('main-content').style.display = 'block';
                 loadKubernetesInfo();
            } else {
                alert('Failed to upload kubeconfig file');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while uploading the kubeconfig file');
        });
    }
}

function loadKubernetesInfo() {
    fetchClusterInfo();
    fetchNamespaces();
    fetchNodeInfo();
    fetchPersistentVolumes();
}

function restartPod(namespace, podName) {
    fetch(`/api/v1/namespaces/${namespace}/pods/${podName}/restart`, { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(`Pod ${podName} restarted successfully.`);
                fetchPods();
            } else {
                alert(`Failed to restart pod ${podName}: ${data.error}`);
            }
        })
        .catch(error => console.error('Error restarting pod:', error));
}

function scalePod(namespace, podName) {
    fetch(`/api/v1/namespaces/${namespace}/pods/${podName}/scale`, { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(`Pod ${podName} scaled to 0 successfully.`);
                fetchPods();
            } else {
                alert(`Failed to scale pod ${podName}: ${data.error}`);
            }
        })
        .catch(error => console.error('Error scaling pod:', error));
}

window.onload = function() {
    const kubeconfigUploaded = sessionStorage.getItem('kubeconfigUploaded');
    
    if (kubeconfigUploaded === 'true') {
        document.getElementById('main-content').style.display = 'block';
        loadKubernetesInfo();
    } else {
        document.getElementById('kubeconfig-upload').style.display = 'block';
    }
};
