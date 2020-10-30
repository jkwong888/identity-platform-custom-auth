import axios from 'axios';

const url_base = 'http://localhost:8080';

export const getCustomToken = (username, password) => {

    console.log("post to " + url_base + '/authenticate');
    return axios.post(url_base + '/authenticate', {
            username: username,
            password: password,
        }
    ).then((response) => {
        //console.log(response.status);
        //console.log(response.data);

        return response.data;
    });
}

