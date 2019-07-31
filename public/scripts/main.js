window.onload = () => {

    const getMarkets = fetch("https://exchange-test-app.herokuapp.com/market");
    const getCurrencies = fetch("https://exchange-test-app.herokuapp.com/currencies");
    const dataPreview = document.getElementsByClassName('data-preview')[0];
    const dataAbsent = document.getElementsByClassName('data-absent')[0];
    const tabUSD = document.getElementsByClassName('tab-usd')[0];
    const tabFavorite = document.getElementsByClassName('tab-favorite')[0];
    const markFavorite = document.getElementsByClassName('mark-favorite');
    const removeFav = document.getElementsByClassName('remove-fav');
    const sortArrows = document.getElementsByClassName('sort');

    let markets = {};
    let currencies = {};
    let usdData = {};
    let favoriteData = JSON.parse(localStorage.getItem('favorites')) || [];

    tabUSD.classList.add('selected');

    Promise.all([getMarkets, getCurrencies]).then(async([markets, currencies]) => {
        const marketList = await markets.json();
        const currencyList = await currencies.json();
        return [marketList, currencyList]
    })
    .then((response) => {

        markets = response[0].market;
        currencies = response[1].currencies;
        if(response.length === 0){
            dataAbsent.style.display = 'table-row-group';
        }
        else {
            dataPreview.style.display = 'table-row-group';
            usdData = getData(markets, currencies);
            usdData.forEach((usdItem)=>{
                favoriteData.map((favItem) => {
                    if(usdItem.currency_code === favItem.currency_code){
                        usdItem.marked = favItem.marked;
                    }
                });
            });
            drawData(usdData, 'price', false);
        }
    }).catch((err) => {
        dataAbsent.style.display = 'table-row-group';
        console.log(err);
    });


    let getData = (markets, currencies) => {
        const finalData = [];
        for (let i = 0; i < markets.length; i++) {
            for (let j = 0; j < currencies.length; j++) {
                if (markets[i].fromCurrencyId === currencies[j].currencyId) {
                    finalData.push({
                        currency_code: markets[i].fromCurrency,
                        currency_name: currencies[j].currencyName,
                        volume: markets[i].volume,
                        price: markets[i].price,
                    });
                }
            }
        }
        return finalData;
    };

    let drawData = (data, sort, acc, showTrash) => {
        dataAbsent.style.display = data.length > 0 ? 'none': 'table-row-group';
        let sortedData = [];
        dataPreview.innerHTML = '';

        if(acc){
            sortedData = data.sort((a,b) => (a[sort] > b[sort]) ? 1 : ((b[sort] > a[sort]) ? -1 : 0));
        }
        else{
            sortedData = data.sort((a,b) => (a[sort] < b[sort]) ? 1 : ((b[sort] < a[sort]) ? -1 : 0));
        }

        for(let i=0;i<sortedData.length;i++){
            sortedData[i].marked = sortedData[i].marked === undefined ? '' : sortedData[i].marked;
            dataPreview.innerHTML +=
                `<tr>` +
                `<td>${sortedData[i].currency_code}</td>` +
                `<td>${sortedData[i].currency_name}</td>` +
                `<td>${sortedData[i].volume} ${sortedData[i].currency_code}</td>` +
                `<td>${sortedData[i].price} ${showTrash ? '<i class="fa remove-fav fa-trash"></i>'
                                                        : '<i class="fa mark-favorite fa-star '+ sortedData[i].marked +'"></i>'}</td>` +
                `</tr>`;
        }
        sortedData.forEach((item, index) => {
            if(!showTrash) {
                markFavorite[index].addEventListener('click', function () {
                    if (this.className.includes('marked')) {
                        this.classList.remove('marked');
                        sortedData[index].marked = '';
                        favoriteData.splice(favoriteData.indexOf(item), 1)
                    } else {
                        this.classList.add('marked');
                        sortedData[index].marked = 'marked';
                        favoriteData.push(item);
                    }
                    localStorage.setItem('favorites', JSON.stringify(favoriteData))
                });
            } else{
                removeFav[index].addEventListener('click', function () {
                    sortedData[index].marked = '';
                    favoriteData.splice(favoriteData.indexOf(item), 1);
                    localStorage.setItem('favorites', JSON.stringify(favoriteData));
                    drawData(favoriteData, 'price', false, true);
                });
            }
        })

    };

    tabUSD.addEventListener('click', () => {
        tabUSD.classList.add('selected');
        tabFavorite.classList.remove('selected');
        drawData(usdData, 'price', false);
    });

    tabFavorite.addEventListener('click', () => {
        tabFavorite.classList.add('selected');
        tabUSD.classList.remove('selected');
        drawData(favoriteData, 'price', false, true);
    });

    for(let i=0;i<sortArrows.length;i++){
        sortArrows[i].addEventListener('click', function() {
            if(this.className.includes('fa-arrow-circle-up')) {
                if(tabUSD.className.includes('selected')) {
                    drawData(usdData, this.getAttribute('sort-by'), false);
                } else{
                    drawData(favoriteData, this.getAttribute('sort-by'), false, true);
                }
                this.classList.remove('fa-arrow-circle-up');
                this.classList.add('fa-arrow-circle-down');
            } else{
                if(tabUSD.className.includes('selected')) {
                    drawData(usdData, this.getAttribute('sort-by'), true);
                } else{
                    drawData(favoriteData, this.getAttribute('sort-by'), true, true);
                }
                this.classList.remove('fa-arrow-circle-down');
                this.classList.add('fa-arrow-circle-up');
            }
        });
    }
};
