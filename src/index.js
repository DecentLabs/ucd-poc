import React from "react";
import { render } from "react-dom";
import { Provider, ReactReduxContext } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import store from "modules/store";
import App from "./containers/app";
import { initialFunction } from "./modules/initialFunctions.js";

const target = document.querySelector("#root");

initialFunction(store);

render(
    <Provider store={store} context={ReactReduxContext}>
        <Router>
            <div>
                <App />
            </div>
        </Router>
    </Provider>,
    target
);
