// document.addEventListener('DOMContentLoaded', () => {
//     const lightThemeLink = document.getElementById('light-theme');
//     const darkThemeLink = document.getElementById('dark-theme');
//     const themeIcon = document.getElementById('theme-icon');
//     const themeToggle = document.getElementById('theme-toggle');

//     // Set the initial theme to 'light' by default
//     lightThemeLink.disabled = false; // Light theme is enabled by default
//     darkThemeLink.disabled = true;  // Dark theme is disabled by default

//     // Function to toggle the theme (Light <-> Dark)
//     function toggleTheme() {
//         if (darkThemeLink.disabled) {
//             // Switch to dark theme
//             lightThemeLink.disabled = true;
//             darkThemeLink.disabled = false;
//             themeIcon.src = '/static/sun-icon.png'; // Switch icon to moon-like appearance (via CSS)
//             themeIcon.style.filter = 'brightness(0) invert(0)';  // Apply dark theme filter (moon look)
//            console.log("B")
//         } else {
//             // Switch to light theme
//             lightThemeLink.disabled = false;
//             darkThemeLink.disabled = true;
//             themeIcon.src = '/static/sun-icon.png'; // Switch icon to sun-like appearance (via CSS)
//             themeIcon.style.filter = 'brightness(0) invert(1)';  // Apply light theme filter (sun look)
//             console.log("D")
//         }
//     }

//     // Theme toggle event listener (click on the icon)
//     themeToggle.addEventListener('click', () => {
//         toggleTheme(); // Toggle theme and icon on icon click
//     });

//     // The rest of your code remains unchanged...
    const headerCanvas = document.getElementById("headerCanvas");
    const context = headerCanvas.getContext("2d");

    // Load image onto canvas
    function loadHeaderImage() {
        const image = new Image();
        image.src = "/static/heading.png"; // Replace with the actual path to your image

        image.onload = function () {
            headerCanvas.width = image.width;
            headerCanvas.height = image.height;
            context.drawImage(image, 0, 0, headerCanvas.width, headerCanvas.height);
        };

        image.onerror = function () {
            console.error("Error loading header image.");
        };
    }

    loadHeaderImage();

   // All other functionality goes here...

document.addEventListener('DOMContentLoaded', () => {
    const categorySelector = document.getElementById("category-selector");
    const compoundSelector = document.getElementById("compound-selector");
    const compoundDetails = document.getElementById("compound-details");
    const compoundCountDisplay = document.getElementById("compound-count");
    const compoundPlot = document.getElementById('compound-plot');

    let allCompounds = {};

    fetch("/compounds")
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            compoundCountDisplay.innerHTML = `<h3>Total Compounds: ${data.total_compounds}</h3>`;
            allCompounds = data.compounds; // Store all compounds globally

            // Initialize the compound selector
            categorySelector.addEventListener("change", function () {
                const selectedCategory = this.value;
                compoundSelector.innerHTML = "<option>Select a compound...</option>"; // Reset compounds
                compoundSelector.disabled = true; // Disable until selection
                if (selectedCategory in allCompounds) {
                    allCompounds[selectedCategory].forEach(compound => {
                        const option = document.createElement("option");
                        option.value = `${compound.sheet}|${compound.name}|${compound.type}`;
                        option.textContent = `${compound.type} - ${compound.name} (${compound.sheet})`;
                        compoundSelector.appendChild(option);
                    });
                    compoundSelector.disabled = false; // Enable if compounds are available
                }
            });
        })
        .catch(error => console.error("Error loading compounds:", error));

    compoundSelector.addEventListener("change", function () {
        const [sheet, compoundName, type] = this.value.split("|");
        if (!sheet || !compoundName || !type) return;

        fetch(`/compound-details/${sheet}/${compoundName}/${type}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(compoundData => {
                displayCompoundDetails(compoundData);
                drawPlot(sheet, compoundName, type);
            })
            .catch(error => console.error("Error loading compound details:", error));
    });

    function displayCompoundDetails(data) {
        compoundDetails.innerHTML = "<h3>Compound Details:</h3>";
        if (data) {
            const detailsTable = document.createElement("table");
            detailsTable.style.width = "100%";
            detailsTable.style.borderCollapse = "collapse";

            const orderedKeys = [
                "S.No",
                "Name",
                "Protective Agents",
                "Uses of Agent",
                "Chemical Properties",
                "Thermal Properties",
                "Mixing with Food",
                "Effects on Environment",
                "Effect on Health if Consumed",
                "Risk",
                "consumption range",
                "Level of Consumption(in ppm)"
            ];

            orderedKeys.forEach(key => {
                if (data[key] !== undefined) {
                    const row = document.createElement("tr");
                    const cellKey = document.createElement("td");
                    const cellValue = document.createElement("td");

                    cellKey.innerHTML = `<strong>${key}:</strong>`;
                    cellValue.innerHTML = data[key];

                    cellKey.style.border = "1px solid lightgreen";
                    cellValue.style.border = "1px solid lightgreen";
                    cellKey.style.padding = "8px";
                    cellValue.style.padding = "8px";
                    cellKey.style.textAlign = "left";
                    cellValue.style.textAlign = "left";

                    row.appendChild(cellKey);
                    row.appendChild(cellValue);
                    detailsTable.appendChild(row);
                }
            });

            compoundDetails.appendChild(detailsTable);
        } else {
            compoundDetails.innerHTML = "<p>No details available for this compound.</p>";
        }
    }

    function drawPlot(sheet, compoundName, type) {
        fetch(`/plot/${sheet}/${compoundName}/${type}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error fetching plot');
                }
                return response.blob();
            })
            .then(imageBlob => {
                const imageObjectURL = URL.createObjectURL(imageBlob);
                compoundPlot.src = imageObjectURL;
                compoundPlot.style.display = 'block';
            })
            .catch(error => console.error("Error loading plot:", error));
    }
});
