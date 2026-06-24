import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/transactions', {
      userId: '0418c4b8-c051-70ae-5560-ea03df9bd9f0', // ID from the seed task
      description: 'Teste',
      amount: 10,
      type: 'expense',
      category: 'variable_expenses',
      account: 'checking'
    });
    console.log('Success:', res.data);
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
