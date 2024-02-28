// @ts-nocheck
export const getStockData = async (/** @type {any} */ symbol, /** @type {any} */ from, /** @type {any} */ to) => {
    const apiKey = "dc16ae239a0a90cc7f039177aa18aa33";
    const apiUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol.toLowerCase()}?apikey=${apiKey}&from=${from}&to=${to}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return { error: `Error fetching stock data: ${error.message}` };
    }
};