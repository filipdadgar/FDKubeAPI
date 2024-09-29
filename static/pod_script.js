
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        namespace: params.get('namespace'),
        pod_name: params.get('pod_name')
    };
}

function createTable(data) {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    data.forEach(item => {
        const row = document.createElement('tr');
        Object.values(item).forEach(value => {
            const td = document.createElement('td');
            td.textContent = typeof value === 'object' ? JSON.stringify(value) : value;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}

function createKeyValueTable(data) {
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    Object.entries(data).forEach(([key, value]) => {
        const row = document.createElement('tr');
        const keyCell = document.createElement('td');
        keyCell.textContent = key;
        const valueCell = document.createElement('td');
        valueCell.textContent = typeof value === 'object' ? JSON.stringify(value) : value;
        row.appendChild(keyCell);
        row.appendChild(valueCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
}

function filterNullValues(obj) {
    if (Array.isArray(obj)) {
        return obj.map(filterNullValues);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([_, v]) => v !== null)
                .map(([k, v]) => [k, filterNullValues(v)])
        );
    } else {
        return obj;
    }
}

function fetchPodDescription() {
    const { namespace, pod_name } = getQueryParams();
    fetch(`/api/v1/namespaces/${namespace}/pods/${pod_name}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const podName = document.getElementById('podName');
            podName.textContent = `Pod Description for pod: ${data.metadata.name}`;

            const podDescription = document.getElementById('podDescription');
            podDescription.innerHTML = '';

            const filteredData = filterNullValues(data);

            const metadataSection = document.createElement('div');
            metadataSection.innerHTML = '<h2>Metadata</h2>';
            metadataSection.appendChild(createKeyValueTable(filteredData.metadata));
            podDescription.appendChild(metadataSection);

            const specSection = document.createElement('div');
            specSection.innerHTML = '<h2>Spec</h2>';
            specSection.appendChild(createKeyValueTable(filteredData.spec));
            podDescription.appendChild(specSection);

            const statusSection = document.createElement('div');
            statusSection.innerHTML = '<h2>Status</h2>';
            statusSection.appendChild(createKeyValueTable(filteredData.status));
            podDescription.appendChild(statusSection);

            if (filteredData.spec.containers) {
                const containersSection = document.createElement('div');
                containersSection.innerHTML = '<h2>Containers</h2>';
                containersSection.appendChild(createTable(filteredData.spec.containers));
                podDescription.appendChild(containersSection);
            }

            if (filteredData.spec.volumes) {
                const volumesSection = document.createElement('div');
                volumesSection.innerHTML = '<h2>Volumes</h2>';
                volumesSection.appendChild(createTable(filteredData.spec.volumes));
                podDescription.appendChild(volumesSection);
            }

            if (filteredData.status.conditions) {
                const conditionsSection = document.createElement('div');
                conditionsSection.innerHTML = '<h2>Conditions</h2>';
                conditionsSection.appendChild(createTable(filteredData.status.conditions));
                podDescription.appendChild(conditionsSection);
            }
        })
        .catch(error => console.error('Error fetching pod description:', error));
}

function goBack() {
    window.history.back();
}


// Fetch pod description on page load
window.onload = fetchPodDescription;
