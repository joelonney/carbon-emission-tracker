// Emission factors (kg CO2e)
const EMISSION_FACTORS = {
    transport: {
        electric: 0,      // 0g CO2/km
        petrol: 0.180,    // 180g CO2/km
        diesel: 0.140,    // 140g CO2/km
        hybrid: 0.120,    // 120g CO2/km
        motorbike: 0.120, // 120g CO2/km
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
    const transportType = slider.dataset.type.trim().toLowerCase();
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
        const selectedValue = option.value.trim().toLowerCase();
        console.log('Transport option selected:', {
            raw: option.value,
            processed: selectedValue
        });
        
        if (!EMISSION_FACTORS.transport.hasOwnProperty(selectedValue)) {
            console.error('Invalid transport type selected:', selectedValue);
            return;
        }
        
        transportDistances.forEach(slider => {
            const sliderType = slider.dataset.type.trim().toLowerCase();
            console.log('Checking slider:', {
                type: sliderType,
                matches: sliderType === selectedValue
            });
            
            if (sliderType === selectedValue) {
                slider.removeAttribute('disabled');
                updateTransportEmissions(slider);
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
                            padding: 8,
                            font: {
                                size: 11
                            }
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
                            text: 'kg CO2e',
                            font: {
                                size: 11
                            }
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 10
                            }
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
        const transport = (formData.get('transport') || '').trim().toLowerCase();
        console.log('Selected transport type (raw):', formData.get('transport'));
        console.log('Selected transport type (processed):', transport);
        console.log('Available transport types:', Object.keys(EMISSION_FACTORS.transport));
        
        // Validate transport type first
        if (!transport) {
            throw new Error('Please select a transport type');
        }

        if (!EMISSION_FACTORS.transport.hasOwnProperty(transport)) {
            console.error('Invalid transport type. Got:', transport);
            console.error('Expected one of:', Object.keys(EMISSION_FACTORS.transport));
            throw new Error(`Invalid transport type: ${transport}`);
        }
        
        let transportDistance = 0;
        const activeSlider = document.querySelector(`.transport-distance[data-type="${transport}"]`);
        if (activeSlider) {
            transportDistance = parseFloat(activeSlider.value) || 0;
            console.log('Transport distance:', transportDistance);
        } else {
            console.warn('No active slider found for transport type:', transport);
            console.log('Available sliders:', Array.from(document.querySelectorAll('.transport-distance')).map(s => s.dataset.type));
        }

        // Get other form values
        const diet = formData.get('diet');
        const energy = formData.get('energy');

        if (!EMISSION_FACTORS.diet[diet]) {
            throw new Error('Invalid diet selection');
        }
        if (!EMISSION_FACTORS.energy[energy]) {
            throw new Error('Invalid energy source');
        }

        // Calculate emissions
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

// Points System
let points = localStorage.getItem('points') ? parseInt(localStorage.getItem('points')) : 0;
let lastUpdate = localStorage.getItem('lastUpdate') ? new Date(localStorage.getItem('lastUpdate')) : null;
let streak = localStorage.getItem('streak') ? parseInt(localStorage.getItem('streak')) : 0;

function updatePoints() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate);
        lastUpdateDate.setHours(0, 0, 0, 0);
        
        const daysDifference = Math.floor((today - lastUpdateDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference === 1) {
            // Consecutive day
            streak++;
            points += 10 + (streak * 2); // Base points + streak bonus
        } else if (daysDifference > 1) {
            // Streak broken
            streak = 1;
            points += 10; // Base points only
        } else if (daysDifference === 0) {
            // Already updated today
            return;
        }
    } else {
        // First time
        streak = 1;
        points += 10;
    }

    lastUpdate = today;
    localStorage.setItem('points', points);
    localStorage.setItem('lastUpdate', lastUpdate.toISOString());
    localStorage.setItem('streak', streak);
    
    updatePointsDisplay();
}

function updatePointsDisplay() {
    document.getElementById('pointsDisplay').textContent = `${points} points`;
    document.getElementById('streakCount').textContent = streak;
}

// Tips System
const TIPS_DATABASE = {
    transport: {
        high: [
            {
                title: "Switch to Public Transport",
                description: "Using public transport can reduce your carbon emissions by up to 70% compared to driving alone.",
                impact: "Potential reduction: 2-4 kg CO2 per day"
            },
            {
                title: "Consider an Electric Vehicle",
                description: "Electric vehicles produce zero direct emissions and can significantly reduce your carbon footprint.",
                impact: "Potential reduction: 3-5 kg CO2 per day"
            },
            {
                title: "Try Carpooling",
                description: "Share rides with colleagues or use carpooling apps to reduce per-person emissions.",
                impact: "Potential reduction: 1-2 kg CO2 per day"
            }
        ],
        medium: [
            {
                title: "Optimize Your Routes",
                description: "Plan your trips to combine multiple errands and avoid peak traffic times.",
                impact: "Potential reduction: 0.5-1 kg CO2 per day"
            }
        ],
        low: [
            {
                title: "Maintain Your Vehicle",
                description: "Regular maintenance ensures optimal fuel efficiency.",
                impact: "Potential reduction: 0.2-0.5 kg CO2 per day"
            }
        ]
    },
    diet: {
        high: [
            {
                title: "Reduce Meat Consumption",
                description: "Try meat-free days or switch to plant-based alternatives for some meals.",
                impact: "Potential reduction: 2-4 kg CO2 per day"
            },
            {
                title: "Choose Local Products",
                description: "Locally sourced food requires less transportation and often has a lower carbon footprint.",
                impact: "Potential reduction: 0.5-1 kg CO2 per day"
            }
        ],
        medium: [
            {
                title: "Plan Your Meals",
                description: "Reduce food waste by planning meals and using leftovers.",
                impact: "Potential reduction: 0.3-0.6 kg CO2 per day"
            }
        ],
        low: [
            {
                title: "Optimize Food Storage",
                description: "Proper food storage extends shelf life and reduces waste.",
                impact: "Potential reduction: 0.1-0.3 kg CO2 per day"
            }
        ]
    },
    energy: {
        high: [
            {
                title: "Switch to Renewable Energy",
                description: "Consider switching to a renewable energy provider or installing solar panels.",
                impact: "Potential reduction: 5-10 kg CO2 per day"
            },
            {
                title: "Improve Home Insulation",
                description: "Better insulation can significantly reduce heating and cooling needs.",
                impact: "Potential reduction: 2-4 kg CO2 per day"
            }
        ],
        medium: [
            {
                title: "Use Smart Temperature Control",
                description: "Install a smart thermostat and optimize temperature settings.",
                impact: "Potential reduction: 1-2 kg CO2 per day"
            }
        ],
        low: [
            {
                title: "Switch to LED Bulbs",
                description: "Replace traditional bulbs with energy-efficient LED alternatives.",
                impact: "Potential reduction: 0.2-0.5 kg CO2 per day"
            }
        ]
    },
    appliances: {
        high: [
            {
                title: "Upgrade to Energy-Efficient Appliances",
                description: "Choose appliances with high energy efficiency ratings when replacing old ones.",
                impact: "Potential reduction: 1-2 kg CO2 per day"
            }
        ],
        medium: [
            {
                title: "Optimize Appliance Usage",
                description: "Run full loads in washing machines and dishwashers, use eco-modes when available.",
                impact: "Potential reduction: 0.5-1 kg CO2 per day"
            }
        ],
        low: [
            {
                title: "Unplug Idle Electronics",
                description: "Reduce standby power consumption by unplugging devices when not in use.",
                impact: "Potential reduction: 0.1-0.3 kg CO2 per day"
            }
        ]
    }
};

function generateTips(emissions) {
    const tipsContainer = document.getElementById('tipsContainer');
    tipsContainer.innerHTML = '';

    const categories = {
        transport: emissions.transport,
        diet: emissions.diet,
        energy: emissions.energy,
        appliances: emissions.appliances
    };

    // Determine which categories need the most attention
    const sortedCategories = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3); // Get top 3 emission sources

    sortedCategories.forEach(([category, value]) => {
        let intensity = 'low';
        if (value > 5) intensity = 'high';
        else if (value > 2) intensity = 'medium';

        const tips = TIPS_DATABASE[category][intensity];
        if (!tips) return;

        const tip = tips[Math.floor(Math.random() * tips.length)];
        const tipElement = document.createElement('div');
        tipElement.className = 'tip-card';
        tipElement.innerHTML = `
            <div class="tip-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            <div class="tip-title">${tip.title}</div>
            <div class="tip-description">${tip.description}</div>
            <div class="tip-impact">${tip.impact}</div>
        `;
        tipsContainer.appendChild(tipElement);
    });
}

// Function to format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to update history display
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = '';

    // Sort data by date (newest first)
    const sortedData = [...dailyData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    // Display last 10 entries
    sortedData.slice(0, 10).forEach(entry => {
        const historyEntry = document.createElement('div');
        historyEntry.className = 'history-entry';
        
        const date = formatDate(entry.date);
        const totalEmission = entry.total.toFixed(2);
        
        // Create breakdown text
        const breakdown = [
            `Transport: ${entry.transport.toFixed(2)}kg`,
            `Diet: ${entry.diet.toFixed(2)}kg`,
            `Energy: ${entry.energy.toFixed(2)}kg`,
            `Appliances: ${entry.appliances.toFixed(2)}kg`
        ].join(' | ');

        historyEntry.innerHTML = `
            <div class="history-details">
                <div class="history-date">${date}</div>
                <div class="history-breakdown">${breakdown}</div>
            </div>
            <div class="history-emission">${totalEmission} kg CO2</div>
        `;
        
        historyContainer.appendChild(historyEntry);
    });
}

// Achievement definitions
const ACHIEVEMENTS = {
    beginner: {
        id: 'beginner',
        name: 'Green Beginner',
        description: 'Earn your first 100 points',
        icon: '🌱',
        requirement: { type: 'points', target: 100 },
        progress: 0
    },
    intermediate: {
        id: 'intermediate',
        name: 'Eco Enthusiast',
        description: 'Accumulate 500 points',
        icon: '🍃',
        requirement: { type: 'points', target: 500 },
        progress: 0
    },
    advanced: {
        id: 'advanced',
        name: 'Sustainability Pro',
        description: 'Reach 1,000 points',
        icon: '🌿',
        requirement: { type: 'points', target: 1000 },
        progress: 0
    },
    expert: {
        id: 'expert',
        name: 'Climate Champion',
        description: 'Achieve 2,000 points',
        icon: '🌳',
        requirement: { type: 'points', target: 2000 },
        progress: 0
    },
    master: {
        id: 'master',
        name: 'Earth Guardian',
        description: 'Earn 5,000 points',
        icon: '🌍',
        requirement: { type: 'points', target: 5000 },
        progress: 0
    },
    legend: {
        id: 'legend',
        name: 'Green Legend',
        description: 'Reach the pinnacle with 10,000 points',
        icon: '⭐',
        requirement: { type: 'points', target: 10000 },
        progress: 0
    }
};

// Load achievements from localStorage
let userAchievements = localStorage.getItem('achievements') 
    ? JSON.parse(localStorage.getItem('achievements')) 
    : { ...ACHIEVEMENTS };

// Enhanced points calculation based on emissions
function calculatePoints(emissions) {
    let points = 10; // Base points for logging

    // Points based on emission levels
    const totalEmissions = emissions.total;
    if (totalEmissions < 5) points += 50; // Excellent
    else if (totalEmissions < 10) points += 30; // Good
    else if (totalEmissions < 15) points += 20; // Average
    
    // Bonus points for green choices
    if (emissions.transport < 1) points += 15; // Low transport emissions
    if (emissions.diet < 3) points += 15; // Plant-based diet
    if (emissions.energy < 0.5) points += 15; // Clean energy
    
    // Streak bonus
    points += (streak * 2);
    
    return points;
}

// Update achievements based on points
function updateAchievements() {
    // Update all achievements based on current points
    Object.values(userAchievements).forEach(achievement => {
        if (achievement.requirement.type === 'points') {
            achievement.progress = Math.min(points, achievement.requirement.target);
        }
    });

    // Save updated achievements
    localStorage.setItem('achievements', JSON.stringify(userAchievements));
    
    // Check for newly completed achievements
    Object.values(userAchievements).forEach(achievement => {
        const wasCompleted = achievement.progress >= achievement.requirement.target;
        if (wasCompleted && !achievement.notified) {
            showAchievementNotification(achievement);
            achievement.notified = true;
        }
    });
    
    // Update the display
    updateAchievementsDisplay();
}

// Update achievements display
function updateAchievementsDisplay() {
    const container = document.getElementById('achievementsContainer');
    container.innerHTML = '';

    Object.values(userAchievements).forEach(achievement => {
        const isComplete = achievement.progress >= achievement.requirement.target;
        const progress = Math.min(achievement.progress / achievement.requirement.target * 100, 100);

        const achievementCard = document.createElement('div');
        achievementCard.className = `achievement-card ${isComplete ? '' : 'locked'}`;
        achievementCard.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-details">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
            <div class="achievement-status">${Math.round(progress)}%</div>
            <div class="achievement-progress" style="width: ${progress}%"></div>
        `;
        container.appendChild(achievementCard);
    });
}

// Show achievement notification
function showAchievementNotification(achievement) {
    alert(`🎉 Achievement Unlocked: ${achievement.name}!\n${achievement.description}`);
}

// Update form submission handler
document.getElementById('carbonQuiz').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData(e.target);
        
        // Validate required fields
        const transport = formData.get('transport');
        const diet = formData.get('diet');
        const energy = formData.get('energy');
        
        if (!transport || !diet || !energy) {
            throw new Error('Please fill in all required fields');
        }

        // Calculate emissions
        const emissions = calculateEmissions(formData);
        
        // Create entry with timestamp
        const entry = {
            date: new Date().toISOString(),
            transport: Number(emissions.transport.toFixed(2)),
            diet: Number(emissions.diet.toFixed(2)),
            energy: Number(emissions.energy.toFixed(2)),
            appliances: Number(emissions.appliances.toFixed(2)),
            total: Number(emissions.total.toFixed(2))
        };

        // Add to daily data
        dailyData.push(entry);
        
        // Keep only last 365 days of data
        if (dailyData.length > 365) {
            dailyData = dailyData.slice(-365);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('carbonData', JSON.stringify(dailyData));
        } catch (storageError) {
            console.error('Error saving to localStorage:', storageError);
        }
        
        // Calculate and update points
        const newPoints = calculatePoints(emissions);
        points += newPoints;
        localStorage.setItem('points', points);
        
        // Update achievements based on new points
        updateAchievements();
        
        // Update UI
        updateStats(emissions);
        updateCharts(emissions);
        generateTips(emissions);
        updateHistoryDisplay();
        updatePointsDisplay();
        
        // Show success message
        const button = e.target.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'Saved!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
        
    } catch (error) {
        console.error('Error processing form:', error);
        alert(error.message || 'There was an error processing your data. Please try again.');
    }
});

// Initialize achievements display on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeCharts();
        
        // Load data from localStorage
        try {
            const storedData = localStorage.getItem('carbonData');
            if (storedData) {
                dailyData = JSON.parse(storedData);
            }
        } catch (storageError) {
            console.error('Error loading from localStorage:', storageError);
            dailyData = [];
        }

        // Update UI with last entry if available
        if (dailyData.length > 0) {
            const lastEntry = dailyData[dailyData.length - 1];
            updateStats(lastEntry);
            updateCharts(lastEntry);
            updateHistoryDisplay();
        }
        
        updatePointsDisplay();
        // Update achievements based on current points
        updateAchievements();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('There was an error loading the dashboard. Please refresh the page.');
    }
}); 