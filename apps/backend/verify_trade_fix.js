function mockExecutePurchase(paymentData, listing) {
    // Simulating the fix applied to trade.service.js
    const { quantity } = paymentData;
    const purchaseQuantity = parseFloat(quantity || '1');

    const unitPrice = listing.price;
    const paymentAmount = parseFloat(unitPrice) * purchaseQuantity;
    const totalAmount = parseFloat(listing.price) * purchaseQuantity;

    return { purchaseQuantity, paymentAmount, totalAmount };
}

const listing = { price: '10', quantityListed: '100', quantitySold: '0' };
const paymentData = { quantity: '15' };

const result = mockExecutePurchase(paymentData, listing);
console.log('Test with Quantity 15:');
console.log('Result:', result);

if (result.purchaseQuantity === 15 && result.paymentAmount === 150 && result.totalAmount === 150) {
    console.log('✅ Success: Logic is correct');
} else {
    console.log('❌ Failure: Logic is incorrect');
}

const resultDefault = mockExecutePurchase({}, listing);
console.log('\nTest with Default Quantity:');
console.log('Result:', resultDefault);

if (resultDefault.purchaseQuantity === 1 && resultDefault.paymentAmount === 10 && resultDefault.totalAmount === 10) {
    console.log('✅ Success: Default logic is correct');
} else {
    console.log('❌ Failure: Default logic is incorrect');
}
