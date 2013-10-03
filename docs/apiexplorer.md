### Using the API Explorer

LoopBack has created a REST API for the sample app. LoopBack provides a web-based
API explorer so you can quickly see and test out the REST API for the models.
Follow these steps:

1. Open your browser to http://localhost:3000/explorer. You'll see a list of REST API endpoints as illustrated below.
<img src="/loopback/assets/explorer-listing.png" alt="API Explorer Listing" width="600" style="border: 1px solid gray; padding: 5px; margin: 10px;">
The endpoints are grouped by the model names. Each endpoint consists of a list
of operations for the model.
2. Click on one of the endpoint paths (such as /locations) to see available
operations for a given model.  You'll see the CRUD operations mapped to HTTP verbs and paths.
<img src="/loopback/assets/explorer-endpoint.png" alt="API Exlporer Endpoints" width="600" style="border: 1px solid gray; padding: 5px; margin: 10px;">
3. Click on a given operation to see the signature; for example, GET `/locations/{id}`:
<img src="/loopback/assets/explorer-api.png" alt="API Spec" width="600" style="border: 1px solid gray; padding: 5px; margin: 10px;">
Notice that each operation has the HTTP verb, path, description, response model, and a list of request parameters.
4. Invoke an operation: fill in the parameters,  then click the ***Try it out!*** button.  You'll see something like this:
<img src="/loopback/assets/explorer-req-res.png alt="Request/Response" width="600" style="border: 1px solid gray; padding: 5px; margin: 10px;">

<h3>Next Steps</h3>

To gain a deeper understanding of LoopBack and how it works, read the following [Key Concepts](#key-concepts) section.

For information on how StrongLoop Suite provides:

 - Out-of-the-box scalability, see
 [StrongNode](http://docs.strongloop.com/strongnode#quick-start).
 - CPU profiling and path trace features, see
 [StrongOps](http://docs.strongloop.com/strongops#quick-start).
 - Mobile client APIs, see [LoopBack Client SDKs](http://docs.strongloop.com/loopback-clients/).
