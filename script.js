// Emission factors (kg CO2e)
const EMISSION_FACTORS = {
    transport: {
        electric: 0,      // 0g CO2/km
        petrol: 0.180,    // 180g CO2/km
        diesel: 0.140,    // 140g CO2/km
        hybrid: 0.120,    // 120g CO2/km
        public: 1.200,    // 1200g CO2/km
        walk: 0,
        wfh: 0
    },
    diet: {
        vegan: 2.470,    // 2,470g CO2/day
        mixed: 5.370,    // 5,370g CO2/day
        carnivore: 10.240 // 10,240g CO2/day
    },
    energy: {
        hydro: 0.120,     // 120g CO2/kWh
        wind: 0.330,      // 330g CO2/kWh
        solar: 1.200,     // 1200g CO2/kWh
        nuclear: 0.360,   // 360g CO2/kWh
        natural_gas: 28.000, // 28000g CO2/kWh
        oil: 35.200,        // 35200g CO2/kWh
        coal: 50.000        // 50000g CO2/kWh
    },
    flight: 0.25 // per hour of flight
};

// Initialize data storage
let dailyData = [];
try {
    const storedData = localStorage.getItem('carbonData');
    if (storedData) {
        dailyData = JSON.parse(storedData);
    }
} catch (error) {
    console.error('Error loading stored data:', error);
    dailyData = [];
}

// Initialize charts
let pieChart, trendChart;

// Handle transport distance updates
const transportDistances = document.querySelectorAll('.transport-distance');
const transportOptions = document.getElementsByName('transport');

function updateTransportEmissions(slider) {
    const distance = parseFloat(slider.value);
    const transportType = slider.dataset.type;
    const rangeValue = slider.parentElement.querySelector('.range-value');
    const emissionValue = slider.parentElement.querySelector('.emission-value');
    
    rangeValue.textContent = `${distance} km/day`;
    
    const emissionPerKm = EMISSION_FACTORS.transport[transportType];
    const totalEmission = (distance * emissionPerKm * 1000).toFixed(0); // Convert to grams
    emissionValue.textContent = `${totalEmission}g CO2/day`;
}

transportDistances.forEach(slider => {
    slider.addEventListener('input', () => updateTransportEmissions(slider));
});

transportOptions.forEach(option => {
    option.addEventListener('change', () => {
        // When a transport option is selected, enable its slider and disable others
        transportDistances.forEach(slider => {
            if (slider.dataset.type === option.value) {
                slider.removeAttribute('disabled');
            } else {
                slider.setAttribute('disabled', 'true');
                slider.value = 0;
                updateTransportEmissions(slider);
            }
        });
    });
});

function initializeCharts() {
    try {
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        const trendCtx = document.getElementById('trendChart').getContext('2d');

        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Transport', 'Diet', 'Home Energy', 'Appliances'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(231, 76, 60, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 10
                        }
                    }
                }
            }
        });

        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily Emissions (kg CO2e)',
                    data: [],
                    borderColor: 'rgba(46, 204, 113, 1)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'kg CO2e'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing charts:', error);
        alert('There was an error initializing the charts. Please refresh the page.');
    }
}

function calculateEmissions(formData) {
    try {
        // Transport emissions calculation
        const transport = formData.get('transport');
        let transportDistance = 0;
        
        const activeSlider = document.querySelector(`.transport-distance[data-type="${transport}"]`);
        if (activeSlider) {
            transportDistance = parseFloat(activeSlider.value) || 0;
        }

        // Get other form values
        const diet = formData.get('diet');
        const energy = formData.get('energy');

        // Validate inputs
        if (!EMISSION_FACTORS.transport[transport]) {
            throw new Error('Invalid transport type');
        }
        if (!EMISSION_FACTORS.diet[diet]) {
            throw new Error('Invalid diet selection');
        }
        if (!EMISSION_FACTORS.energy[energy]) {
            throw new Error('Invalid energy source');
        }

        // Calculate base emissions
        const transportEmissions = EMISSION_FACTORS.transport[transport] * transportDistance;
        const dietEmissions = EMISSION_FACTORS.diet[diet];
        const energySourceFactor = EMISSION_FACTORS.energy[energy]; // CO2/kWh factor for the energy source

        // Calculate appliance emissions
        const selectedAppliances = formData.getAll('appliances');
        let applianceEmissions = 0;

        // Define appliance energy usage in kWh and their usage patterns
        const APPLIANCE_ENERGY = {
            microwave: { kWh: 0.945, uses: 1 }, // per use
            washing_machine: { kWh: 0.63, uses: 1 }, // per cycle
            tumble_dryer: { kWh: 2.50, uses: 1 }, // per cycle
            kettle: { kWh: 0.11, uses: 3 }, // assumes 3 uses per day
            standard_bulb: { kWh: 0.4, uses: 1 }, // 100W * 4 hours
            eco_bulb: { kWh: 0.072, uses: 1 }, // 18W * 4 hours
            shower: { kWh: 4.0, uses: 1 }, // 10 min shower
            electric_hob: { kWh: 1.56, uses: 1 }, // per use
            gas_hob: { kWh: 0.9, uses: 1 }, // per use
            air_con: { kWh: 10.0, uses: 1 } // average daily use
        };

        // Calculate emissions for each selected appliance
        selectedAppliances.forEach(appliance => {
            if (APPLIANCE_ENERGY[appliance]) {
                const { kWh, uses } = APPLIANCE_ENERGY[appliance];
                // Multiply appliance energy by energy source emission factor and daily uses
                applianceEmissions += kWh * energySourceFactor * uses;
            }
        });

        // Calculate total home energy emissions (appliances + base household consumption)
        const baseHouseholdkWh = 10; // Average base household consumption per day in kWh
        const energyEmissions = (baseHouseholdkWh * energySourceFactor) + applianceEmissions;

        return {
            transport: transportEmissions,
            diet: dietEmissions,
            energy: energyEmissions,
            appliances: applianceEmissions,
            total: transportEmissions + dietEmissions + energyEmissions + applianceEmissions
        };
    } catch (error) {
        console.error('Error calculating emissions:', error);
        throw error;
    }
}

function updateStats(emissions) {
    try {
        const today = document.getElementById('todayEmissions');
        const weekly = document.getElementById('weeklyAverage');
        const monthly = document.getElementById('monthlyTotal');

        today.textContent = `${emissions.total.toFixed(2)} kg CO2`;
        
        const weeklyData = dailyData.slice(-7);
        const weeklyAvg = weeklyData.reduce((sum, day) => sum + day.total, 0) / weeklyData.length || 0;
        weekly.textContent = `${weeklyAvg.toFixed(2)} kg CO2`;

        const monthlyData = dailyData.slice(-30);
        const monthlyTotal = monthlyData.reduce((sum, day) => sum + day.total, 0);
        monthly.textContent = `${monthlyTotal.toFixed(2)} kg CO2`;
    } catch (error) {
        console.error('Error updating stats:', error);
        throw error;
    }
}

function updateCharts(emissions) {
    try {
        // Update pie chart
        pieChart.data.datasets[0].data = [
            emissions.transport,
            emissions.diet,
            emissions.energy,
            emissions.appliances
        ];
        pieChart.update();

        // Update trend chart
        const dates = dailyData.slice(-30).map(entry => {
            const date = new Date(entry.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const values = dailyData.slice(-30).map(entry => entry.total);

        trendChart.data.labels = dates;
        trendChart.data.datasets[0].data = values;
        trendChart.update();
    } catch (error) {
        console.error('Error updating charts:', error);
        throw error;
    }
}

// Form submission
document.getElementById('carbonQuiz').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData(e.target);
        const emissions = calculateEmissions(formData);
        
        // Add to daily data
        const entry = {
            date: new Date().toISOString(),
            ...emissions
        };
        dailyData.push(entry);
        
        // Keep only last 365 days of data
        if (dailyData.length > 365) {
            dailyData = dailyData.slice(-365);
        }
        
        // Save to localStorage
        localStorage.setItem('carbonData', JSON.stringify(dailyData));
        
        // Update UI
        updateStats(emissions);
        updateCharts(emissions);
        
        // Show success message
        const button = e.target.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'Saved!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Error processing form:', error);
        alert('There was an error processing your data. Please try again.');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeCharts();
        if (dailyData.length > 0) {
            const lastEntry = dailyData[dailyData.length - 1];
            updateStats(lastEntry);
            updateCharts(lastEntry);
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('There was an error loading the dashboard. Please refresh the page.');
    }
}); 