const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
chai.use(chaiHttp);
const expect = chai.expect;

describe('API Test', () => {
  it('should return 404 for an unknown endpoint', async () => {
    const res = await chai.request(server).get('/unknown');
    expect(res).to.have.status(404);
    expect(res.body).to.be.an('object').that.includes({ mensagem: 'Endpoint não encontrado.' });
  });

});
