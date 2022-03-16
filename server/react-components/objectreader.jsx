import React from 'react'
// import { Box } from 'admin-bro'

class App extends React.Component {
    renderObjects() {
        const property = this.props.property;
        const record = this.props.record;
        const nameRegExp = new RegExp(`^${property.name}`, 'i');
        const params = record.params;
        const res = [];
        Object.keys(params).map(k => {
            if (k.match(nameRegExp)) {
                let _loc = k.split('.');
                let _key = _loc[1];
                let _idx = _loc[2];
                let _val = params[k];
                res.push([_key, _idx, _val]);
            }
        });
        // res.sort((a, b) => a[1] - b[1]);
        return <ul>{res.map((r, idx) => {return <li key={idx}>{r[0]} [{r[1]}] : <span>{r[2]}</span></li>})}</ul>;
    }
    
    render() {
        return (
            <section>
                <label className="fyQNXW">{this.props.property.name}</label>
                <span>{this.renderObjects()}</span>
            </section>
        )
    }
}

// const reader = (props) => {
  
// }

export default App