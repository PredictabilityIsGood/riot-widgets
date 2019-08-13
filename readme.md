# Riot-Widgets

[demo](https://predictabilityisgood.github.io/riot-widgets/)

## Include
```html
<script src="widgets/widget-grid.html" type="riot"></script>
```

## Mount
```javascript
riot.mount("widget-grid", 
    {
        data:[
            {
                "Id":1,
                "Name":"Ryan",
                "Age":27,
                "Email":"test@test.com",
                "Is":false
            } /*... More data */
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
        callbacks:{ /* Handle your server side actions by defining your own callbacks */
            put:(updated)=> console.log(updated),
            post:(created)=> console.log(created),
            delete:(deleted)=> console.log(deleted)
        },
        theme:{
            bg:"light",
            border:"light",
            text:"dark",
            matchContents:true
        }
    });
```

## Use
```html
<widget-grid { ...attributes }></widget-grid>
```