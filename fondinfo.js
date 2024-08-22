document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'https://api.extraetf.com/customer-api/ic/detail/?isin=AT0000A2B4U1';

    // Utility function to create and append a new element
    function createElement(type, className, textContent) {
        const element = document.createElement(type);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
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
            const countryDiv = createElement('div', 'text-size-regular pos_country', holding.country_code || 'N/A');
            const assetDiv = createElement('div', 'text-size-regular pos_asset', holding.type_name_full || 'N/A');

            // Append elements
            indicatorComponent.appendChild(indicatorLine);
            indicatorComponent.appendChild(indicatorBg);
            percentageWrapper.appendChild(indicatorComponent);
            percentageWrapper.appendChild(percentageText);

            container.appendChild(holdingDiv);
            container.appendChild(percentageWrapper);
            container.appendChild(countryDiv);
            container.appendChild(assetDiv);
        });
    }

    // Function to render the main donut chart
    function renderDonutChart(allocation) {
        const bondAndStock = allocation.bond + allocation.stock;
        const totalAllocation = allocation.bond + allocation.stock + allocation.cash + allocation.other;
        const sonstiges = totalAllocation - bondAndStock;

        const data = {
            labels: ['Aktien und Anleihen', 'Cash & Sonstiges'],
            datasets: [{
                data: [bondAndStock, sonstiges],
                backgroundColor: ['#182167', '#f7c2a5'],
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
        const sectors = sectorBreakdown.map(sector => ({
            name: sector.type_name,
            value: sector.value,
            color: getRandomColor() // You can customize or choose specific colors here
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
                        display: false // Hide the legend if you prefer to use custom labels
                    }
                }
            }
        });

        // Populate the sector labels with percentages
        const branchenHolder = document.querySelector('.branchen_holder');
        branchenHolder.innerHTML = ''; // Clear existing content

        sectors.forEach(sector => {
            const percentageHolder = createElement('div', 'piechart_percentage-holder');
            const percentageText = createElement('div', 'text-size-medium pie_percentage', `${sector.value.toFixed(2)}%`);
            const nameText = createElement('div', 'text-size-medium op_50 pie_name', sector.name);

            percentageHolder.appendChild(percentageText);
            percentageHolder.appendChild(nameText);
            branchenHolder.appendChild(percentageHolder);
        });
    }

    // Function to render the country breakdown pie chart and labels
    function renderCountryBreakdown(countryBreakdown) {
        const countries = Object.keys(countryBreakdown.stock).map(countryCode => ({
            name: countryCode,
            value: countryBreakdown.stock[countryCode],
            color: getRandomColor() // Customize or choose specific colors if needed
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
            const percentageText = createElement('div', 'text-size-medium pie_percentage', `${country.value.toFixed(2)}%`);
            const nameText = createElement('div', 'text-size-medium op_50 pie_name', country.name);

            percentageHolder.appendChild(percentageText);
            percentageHolder.appendChild(nameText);
            laenderHolder.appendChild(percentageHolder);
        });
    }

    // Utility function to generate a random color
    function getRandomColor() {
        const baseColor = [24, 33, 103]; // RGB values for #182167
        const variation = 30; // Adjust this value to control the range of shades

        const randomOffset = () => Math.floor(Math.random() * variation) - (variation / 2);

        const r = Math.max(0, Math.min(255, baseColor[0] + randomOffset()));
        const g = Math.max(0, Math.min(255, baseColor[1] + randomOffset()));
        const b = Math.max(0, Math.min(255, baseColor[2] + randomOffset()));

        return `rgb(${r}, ${g}, ${b})`;
    }

      // Function to update all elements with the attribute 'hs-total-return' with the cumulative total return
      function updateTotalReturn(cumulativeTotalReturn) {
        console.log('updateTotalReturn called with:', cumulativeTotalReturn);

        const totalReturnElements = document.querySelectorAll('[hs-total-return]');
        console.log('Found totalReturnElements:', totalReturnElements.length);

        totalReturnElements.forEach((element, index) => {
            console.log(`Updating element at index ${index} with value:`, cumulativeTotalReturn.toFixed(2));
            element.textContent = `${cumulativeTotalReturn.toFixed(2)}%`;
        });

        console.log('updateTotalReturn completed.');
    }

    // Function to handle API response and dispatch to rendering functions
    function handleApiResponse(apiData) {
        const results = apiData.results && apiData.results[0];

        if (results) {
            // Update the cumulative total return
            if (results.cumulative_total_return_since_inception) {
                console.log('Updating total return with:', results.cumulative_total_return_since_inception);

                updateTotalReturn(results.cumulative_total_return_since_inception);
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
