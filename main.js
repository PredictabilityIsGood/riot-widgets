(async function main(){
    await riot.compile();
    console.log("compilation done");
    riot.mount("demo");
}())