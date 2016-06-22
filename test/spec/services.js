import {SpecRunner} from '../specRunner';

let chai = require('chai'),
    chaiHttp = require('chai-http'),
    should = chai.should();

chai.use(chaiHttp);

let runner = new SpecRunner('services');

describe('Services', () => {

  before((done) => {
    runner.getLoader().drop(runner.getLoader().load(done));
  });

  after((done) => {
    runner.getLoader().drop(done);
  });

  it('should get a service on /services/:id GET', (done) => {
    chai.request(runner.getApp())
      .get('/services/5767475d4f132cbaca88686b')
      .end(function(err, res){
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('id');
        res.body.data.should.have.property('type');
        res.body.data.type.should.equal('service');
        res.body.data.should.have.property('attributes');
        res.body.data.attributes.should.be.a('object');
        done();
      });
  });

  it('should return a 404 when a bad service ID is given on /services/:id GET', (done) => {
    chai.request(runner.getApp())
      .get('/services/5767475d4f132cbaca88686c')
      .end(function(err, res){
        res.should.have.status(404);
        res.body.should.be.empty;
        done();
      });
  });

  it('should list services on /services GET', (done) => {
    chai.request(runner.getApp())
      .get('/services')
      .end(function(err, res){
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.an('object');
        res.body.should.have.property('data');
        res.body.data.should.be.an('array');
        res.body.data.should.have.length.of(2);
        done();
      });
  });

  it('should create a new service on /services POST', (done) => {
    let post = {
      data: {
        type: "service",
        attributes: {
          name: "New Service",
          type: "STATIC",
          base: "test",
          static: {
            servers: ["http://localhost:3002"]
          }
        }
      }
    };
    chai.request(runner.getApp())
      .post('/services')
      .send(post)
      .end(function(err, res){
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('id');
        res.body.data.should.have.property('type');
        res.body.data.type.should.equal('service');
        res.body.data.should.have.property('attributes');
        res.body.data.attributes.should.be.a('object');
        done();
      });
  });

  it('should update an existing service on /services/:id PATCH', () => {
    let patch = {
      data: {
        id: "5767475d4f132cbaca88686b",
        type: "service",
        attributes: {
          name: "New Service 1 Updated"
        }
      }
    };

    chai.request(runner.getApp())
      .patch('/services/5767475d4f132cbaca88686b')
      .send(patch)
      .end(function(err, res){
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('data');
        res.body.data.should.have.property('id');
        res.body.data.should.have.property('type');
        res.body.data.type.should.equal('service');
        res.body.data.should.have.property('attributes');
        res.body.data.attributes.should.be.a('object');
        res.body.data.attributes.name.should.be('New Service 1 Updated');
        done();
      });
  });

  it('should return no content on a reload', (done) => {
    chai.request(runner.getApp())
      .get('/services/reload')
      .end(function(err, res){
        res.should.have.status(204);
        res.body.should.be.empty;
        done();
      });
  });
});