(async function main(){
    await riot.compile();

    console.log("compilation done");
    riot.mount("widget-grid", 
    {
        data:[
            {
                "Id":1,
                "Name":"Ryan",
                "Age":27,
                "Email":"test@test.com",
                "Is":false
            },{
                "Id":2,
                "Name":"Kiichi",
                "Age":null,
                "Email":"anothertest@test.com",
                "Is":true
            },{
                "Id":3,
                "Name":"Justin",
                "Age":null,
                "Email":"testing123@test.com",
                "Is":false
            },{
                "Id":4,
                "Name":"Korey",
                "Age":null,
                "Email":"information@test.com",
                "Is":false
            },{
                "Id":5,
                "Name":"James",
                "Age":null,
                "Email":"testinformation@test.com",
                "Is":false
            }
        ],
        options:{
            "Id":{
                alias:"UserID",
                pk:true,
                put:false,
                visible:false
            },
            "Name":{
                alias:"Involved Person"
            },
            "Age":{
                alias:"Incident Age",
                type:Number,
            },
            "Is":{
            }
        },
        tableOptions:{
            post:true,
            delete:true
        },
        typeSort:{
            "String":(a,b)=>{
                return a.localeCompare(b);
            },
            "Number":(a,b)=>{
                a=a==null?-Infinity:a;
                b=b==null?-Infinity:b;
                return parseFloat(a)-parseFloat(b);
            },
            "Date":(a,b)=>{
                return a-b;
            },
            "Boolean":(a,b)=>{
                return a-b;
            }
        },
        theme:{
            bg:"light",
            border:"light",
            text:"dark",
            matchContents:true
        }
    });
}())