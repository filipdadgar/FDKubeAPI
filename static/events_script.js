document.addEventListener('DOMContentLoaded', () => {
    fetchEvents();
    document.getElementById('timestampHeader').addEventListener('click', sortTableByTimestamp);
});

function fetchEvents() {
    fetch('/api/v1/events')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const eventsTable = document.getElementById('eventsTable').getElementsByTagName('tbody')[0];
            eventsTable.innerHTML = ''; // Clear existing rows
            data.items.forEach(event => {
                const row = eventsTable.insertRow();
                const typeCell = row.insertCell(0);
                const reasonCell = row.insertCell(1);
                const messageCell = row.insertCell(2);
                const timestampCell = row.insertCell(3);

                typeCell.textContent = event.type;
                reasonCell.textContent = event.reason;
                messageCell.textContent = event.message;
                timestampCell.textContent = new Date(event.timestamp).toLocaleString();
                timestampCell.setAttribute('data-timestamp', event.timestamp); // Store the raw timestamp for sorting
            });
        })
        .catch(error => console.error('Error fetching events:', error));
}

function sortTableByTimestamp() {
    const table = document.getElementById('eventsTable');
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    const sortArrow = document.getElementById('sortArrow');

    // Determine the current sort direction
    const currentSortDirection = table.getAttribute('data-sort-direction') || 'asc';
    const newSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    table.setAttribute('data-sort-direction', newSortDirection);

    // Update the sort arrow
    sortArrow.textContent = newSortDirection === 'asc' ? '▲' : '▼';

    // Sort rows based on the timestamp
    rows.sort((a, b) => {
        const timestampA = new Date(a.cells[3].getAttribute('data-timestamp')).getTime();
        const timestampB = new Date(b.cells[3].getAttribute('data-timestamp')).getTime();
        return newSortDirection === 'asc' ? timestampA - timestampB : timestampB - timestampA;
    });

    // Append sorted rows back to the table body
    rows.forEach(row => tbody.appendChild(row));
}