document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'https://api.extraetf.com/customer-api/ic/detail/?isin=AT0000A2B4U1';

    // Utility function to create and append a new element
    function createElement(type, className, textContent) {
        const element = document.createElement(type);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    // Function to update stats elements
    function updateStatsElements(data) {
        const statsElements = document.querySelectorAll('[number_of_bond_holdings], [number_of_holdings], [number_of_stock_holdings], [kbv], [kgv]');
        statsElements.forEach(element => {
            const attribute = element.getAttribute('number_of_bond_holdings') !== null ? 'number_of_bond_holdings' :
                              element.getAttribute('number_of_holdings') !== null ? 'number_of_holdings' :
                              element.getAttribute('number_of_stock_holdings') !== null ? 'number_of_stock_holdings' :
                              element.getAttribute('kbv') !== null ? 'kbv' :
                              element.getAttribute('kgv') !== null ? 'kgv' : null;

            if (attribute) {
                let value;
                if (attribute === 'kbv' || attribute === 'kgv') {
                    value = data.fund_portfolio_prospective[attribute];
                } else {
                    value = data.fund_portfolio_n[attribute];
                }
                element.textContent = value !== null ? value.toFixed(2) : 'N/A';
            }
        });
    }

    // Function to render fund holdings
    function renderFundHoldings(fundHoldings) {
        const container = document.querySelector('.positions_content-grid');
        container.innerHTML = ''; // Clear existing content

        fundHoldings.forEach(holding => {
            const holdingDiv = createElement('div', 'text-size-regular pos_name', holding.name);

            const percentageWrapper = createElement('div', 'percentage_wrapper');
            const indicatorComponent = createElement('div', 'indicator_component is-rounded-15');
            const indicatorLine = createElement('div', 'indicator_line pos_line');
            indicatorLine.style.width = `${holding.weight}%`;

            const indicatorBg = createElement('div', 'indicator_bg');
            const percentageText = createElement('div', 'text-size-small pos_percentage', `${holding.weight.toFixed(2)}%`);
            const assetDiv = createElement('div', 'text-size-regular pos_asset', holding.type_name_full || 'N/A');

            // Append elements
            indicatorComponent.appendChild(indicatorLine);
            indicatorComponent.appendChild(indicatorBg);
            percentageWrapper.appendChild(indicatorComponent);
            percentageWrapper.appendChild(percentageText);

            container.appendChild(holdingDiv);
            container.appendChild(percentageWrapper);
            container.appendChild(assetDiv);
        });
    }

    // Function to render the main donut chart
    function renderDonutChart(allocation) {
        const data = {
            labels: ['Aktien', 'Anleihen', 'Cash', 'Sonstiges'],
            datasets: [{
                data: [allocation.stock, allocation.bond, allocation.cash, allocation.other],
                backgroundColor: ['#182167', '#f7c2a5', '#36A2EB', '#FF6384'],
            }]
        };

        const ctx = document.getElementById('myDonutChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Function to render the asset allocation breakdown
    function renderAssetAllocationBreakdown(allocation) {
        const piechartHolder = document.querySelector('.piechart_holder');
        piechartHolder.innerHTML = ''; // Clear existing content

        const totalAllocation = allocation.bond + allocation.stock + allocation.cash + allocation.other;

        const assetTypes = [
            { name: 'Aktien', value: allocation.stock, color: '#182167' },
            { name: 'Anleihen', value: allocation.bond, color: '#f7c2a5' },
            { name: 'Cash', value: allocation.cash, color: '#36A2EB' },
            { name: 'Sonstiges', value: allocation.other, color: '#FF6384' }
        ];

        assetTypes.forEach(asset => {
            const percentage = ((asset.value / totalAllocation) * 100).toFixed(2);

            const percentageHolder = createElement('div', 'piechart_percentage-holder');
            const percentageText = createElement('div', 'text-size-medium pie_percentage', `${percentage}%`);
            const nameText = createElement('div', 'text-size-medium op_50 pie_name', asset.name);

            percentageHolder.appendChild(percentageText);
            percentageHolder.appendChild(nameText);

            piechartHolder.appendChild(percentageHolder);
        });
    }

    // Function to render annualized returns inside .renditen_annual
    function renderAnnualizedReturns(trailingReturns) {
        const renditenAnnual = document.querySelector('.renditen_annual');
        renditenAnnual.innerHTML = ''; // Clear existing content

        const periods = [
            { label: '1M', value: trailingReturns['1m'] },
            { label: '2M', value: trailingReturns['2m'] },
            { label: '3M', value: trailingReturns['3m'] },
            { label: '6M', value: trailingReturns['6m'] },
            { label: '9M', value: trailingReturns['9m'] },
            { label: 'YTD', value: trailingReturns['ytd'] },
            { label: '1Y', value: trailingReturns['1y'] },
            { label: '2Y PA', value: trailingReturns['2y_pa'] },
            { label: '3Y PA', value: trailingReturns['3y_pa'] },
            { label: '4Y PA', value: trailingReturns['4y_pa'] },
            { label: 'Since Inception PA', value: trailingReturns['since_inception_pa'] }
        ];

        periods.forEach(period => {
            if (period.value !== null) { // Only display periods with available data
                const percentageHolder = createElement('div', 'piechart_percentage-holder');
                const nameText = createElement('div', 'text-size-medium op_50 pie_name', `${period.label}`);
                const percentageText = createElement('div', 'text-size-medium pie_percentage', `${(period.value).toFixed(2)}%`);

                percentageHolder.appendChild(nameText);
                percentageHolder.appendChild(percentageText);

                renditenAnnual.appendChild(percentageHolder);
            }
        });
    }

    // Function to render the sector breakdown pie chart and labels
    function renderSectorBreakdown(sectorBreakdown) {
        // Function to generate faded, pleasing colors
        function generateFadedColor(index, total) {
            const hues = [210, 190, 230, 170, 250]; // Different hues in the blue-green-purple spectrum
            const hue = hues[index % hues.length];
            const saturation = 30 + (index % 3) * 10; // Lower saturation for faded look
            const lightness = 65 + (index % 3) * 5; // Higher lightness for pastel-like colors
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }
    
        const sectors = sectorBreakdown.map((sector, index) => ({
            name: sector.type_name,
            value: sector.value,
            color: generateFadedColor(index, sectorBreakdown.length)
        }));
    
        // Populate the pie chart
        const ctx = document.getElementById('myBranchen').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: sectors.map(sector => sector.name),
                datasets: [{
                    data: sectors.map(sector => sector.value),
                    backgroundColor: sectors.map(sector => sector.color)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    
        // Populate the sector labels with percentages
        const branchenHolder = document.querySelector('.branchen_holder');
        branchenHolder.innerHTML = ''; // Clear existing content
    
        sectors.forEach(sector => {
            const percentageHolder = createElement('div', 'piechart_percentage-holder');
            const colorIndicator = createElement('div', 'color-indicator');
            colorIndicator.style.backgroundColor = sector.color;
            const percentageText = createElement('div', 'text-size-medium pie_percentage', `${sector.value.toFixed(2)}%`);
            const nameText = createElement('div', 'text-size-medium op_50 pie_name', sector.name);
    
            percentageHolder.appendChild(colorIndicator);
            percentageHolder.appendChild(percentageText);
            percentageHolder.appendChild(nameText);
            branchenHolder.appendChild(percentageHolder);
        });
    }

    function renderCountryBreakdown(countryBreakdown) {
        // Function to generate faded, pleasing colors
        function generateFadedColor(index, total) {
            const hues = [210, 190, 230, 170, 250]; // Different hues in the blue-green-purple spectrum
            const hue = hues[index % hues.length];
            const saturation = 30 + (index % 3) * 10; // Lower saturation for faded look
            const lightness = 65 + (index % 3) * 5; // Higher lightness for pastel-like colors
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }
    
        const countries = Object.keys(countryBreakdown.stock).map((countryCode, index) => ({
            name: countryCode,
            value: countryBreakdown.stock[countryCode],
            color: generateFadedColor(index, Object.keys(countryBreakdown.stock).length)
        }));
    
        // Populate the pie chart
        const ctx = document.getElementById('myLaender').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: countries.map(country => country.name),
                datasets: [{
                    data: countries.map(country => country.value),
                    backgroundColor: countries.map(country => country.color)
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false // Hide the legend if using custom labels
                    }
                }
            }
        });
    
        // Populate the country labels with percentages
        const laenderHolder = document.querySelector('.laender_holder');
        laenderHolder.innerHTML = ''; // Clear existing content
    
        countries.forEach(country => {
            const percentageHolder = createElement('div', 'piechart_percentage-holder');
            const colorIndicator = createElement('div', 'color-indicator');
            colorIndicator.style.backgroundColor = country.color;
            const percentageText = createElement('div', 'text-size-medium pie_percentage', `${country.value.toFixed(2)}%`);
            const nameText = createElement('div', 'text-size-medium op_50 pie_name', country.name);
    
            percentageHolder.appendChild(colorIndicator);
            percentageHolder.appendChild(percentageText);
            percentageHolder.appendChild(nameText);
            laenderHolder.appendChild(percentageHolder);
        });
    }

    function updateRiskRatingElements(riskAndRating) {
        const formatValue = (value) => value !== null ? value.toFixed(2) : 'N/A';
    
        const updateElement = (attribute, getKey) => {
            const element = document.querySelector(`[${attribute}]`);
            if (element) {
                const values = [1, 3, 5].map(year => {
                    const yearData = riskAndRating[year.toString()];
                    return yearData ? formatValue(yearData[getKey]) : 'N/A';
                });
                element.textContent = values.join(' / ');
            }
        };
    
        updateElement('vola', 'volatility');
        updateElement('drawdown', 'max_drawdown');
        updateElement('sharpe', 'sharpe_ratio');
        updateElement('alpha', 'alpha');
    }

    // Function to handle API response and dispatch to rendering functions
    function handleApiResponse(apiData) {
        const results = apiData.results && apiData.results[0];

        if (results) {
            // Update stats elements
            updateStatsElements(results);

            // Update risk and rating elements
            if (results.risk_and_rating) {
                updateRiskRatingElements(results.risk_and_rating);
            }

            // Update the cumulative total return
            if (results.returns_nav && results.returns_nav['0P0001K82W'] && results.returns_nav['0P0001K82W'].cumulative_total_return_since_inception) {
                const totalReturn = results.returns_nav['0P0001K82W'].cumulative_total_return_since_inception;
                const formattedReturn = totalReturn.toFixed(2) + '%';
                document.querySelectorAll('[hs-total-return]').forEach(el => {
                    el.textContent = formattedReturn;
                });
            }

            // Render fund holdings
            if (results.fund_portfolio_holdings) {
                renderFundHoldings(results.fund_portfolio_holdings);
            }

            // Render asset allocation and breakdown
            if (results.fund_portfolio_asset_allocation) {
                renderDonutChart(results.fund_portfolio_asset_allocation);
                renderAssetAllocationBreakdown(results.fund_portfolio_asset_allocation);
            }

            // Render annualized returns
            if (results.trailing_return_month_end) {
                renderAnnualizedReturns(results.trailing_return_month_end);
            }

            // Render sector breakdown
            if (results.fund_portfolio_global_stock_sector_breakdown) {
                renderSectorBreakdown(results.fund_portfolio_global_stock_sector_breakdown);
            }

            // Render country breakdown
            if (results.fund_portfolio_country_breakdown) {
                renderCountryBreakdown(results.fund_portfolio_country_breakdown);
            }
        }
    }

    // Function to fetch data from API
    function fetchData(url) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(handleApiResponse)
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }

    // Fetch data on DOMContentLoaded
    fetchData(API_URL);
});