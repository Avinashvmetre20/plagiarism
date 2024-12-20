async function selectFolder() {
    try {
        // Show a directory picker to select a folder
        const directoryHandle = await window.showDirectoryPicker();
        const filesObject = {};

        // Iterate through the files in the folder
        for await (const entry of directoryHandle.values()) {
            if (entry.kind === "file" && entry.name.endsWith(".txt")) {
                const file = await entry.getFile();
                const content = await file.text();
                filesObject[file.name] = content;
            }
        }

        return filesObject;
    } catch (error) {
        console.error("Error selecting folder:", error);
        alert("Failed to access the folder or no files selected.");
        return null;
    }
}

function normalizeText(text) {
    const stopwords = ["a", "an", "the", "and", "is", "in", "on", "at", "of", "this"];
    return text
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter((word) => !stopwords.includes(word));
}

function calculateSimilarity(arr1, arr2) {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = [...set1].filter(word => set2.has(word));
    const union = new Set([...set1, ...set2]);
    const similarity = (intersection.length / union.size) * 100;
    return similarity.toFixed(2);
}

function generateFlaggedReport(matrix, threshold = 50, ids) {
    const flaggedPairs = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = i + 1; j < matrix.length; j++) {
            if (matrix[i][j] > threshold) {
                flaggedPairs.push([`${ids[i]}`, `${ids[j]}`, matrix[i][j]]);
            }
        }
    }
    return flaggedPairs;
}

document.getElementById("selectFolder").addEventListener("click", async () => {
    const filesObject = await selectFolder();

    // Store the files object for use in the form submission
    if (filesObject) {
        window.selectedFiles = filesObject;
        alert("Folder loaded successfully!");
    } else {
        alert("No valid files found in the folder.");
    }
});

document.getElementById("folderForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const filesObject = window.selectedFiles;
    const threshold = Number(document.getElementById("threshold").value);

    if (!filesObject) {
        alert("Please select a folder first.");
        return;
    }

    const normalizedAssignments = {};
    for (let id in filesObject) {
        normalizedAssignments[id] = normalizeText(filesObject[id]);
    }

    const ids = Object.keys(normalizedAssignments);
    const similarityMatrix = [];

    for (let i = 0; i < ids.length; i++) {
        const row = [];
        for (let j = 0; j < ids.length; j++) {
            const similarity = calculateSimilarity(
                normalizedAssignments[ids[i]],
                normalizedAssignments[ids[j]]
            );
            row.push(Number(similarity));
        }
        similarityMatrix.push(row);
    }

    displayMatrix(similarityMatrix, ids, threshold);
    const report = generateFlaggedReport(similarityMatrix, threshold, ids);
    displayReport(report);
});

function displayMatrix(matrix, ids, threshold) {
    const table = document.getElementById("similarityMatrix");
    table.innerHTML = "";

    // Add header row
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>File</th>${ids.map(id => `<th>${id}</th>`).join("")}`;
    table.appendChild(headerRow);

    // Add data rows
    matrix.forEach((row, i) => {
        const dataRow = document.createElement("tr");
        dataRow.innerHTML = `<td>${ids[i]}</td>${row.map((value, j) => {
            const flaggedClass = value > threshold ? "flagged" : "";
            return `<td class="${flaggedClass}">${value}</td>`;
        }).join("")}`;
        table.appendChild(dataRow);
    });
}

function displayReport(report) {
    const table = document.getElementById("flaggedReport");
    table.innerHTML = "";

    // Add header row
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = "<th>File 1</th><th>File 2</th><th>Similarity (%)</th>";
    table.appendChild(headerRow);

    // Add data rows
    report.forEach(([file1, file2, similarity]) => {
        const dataRow = document.createElement("tr");
        dataRow.innerHTML = `<td>${file1}</td><td>${file2}</td><td>${similarity}</td>`;
        table.appendChild(dataRow);
    });
}
