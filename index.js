const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const _ = require('lodash');
const { random } = require('lodash/number');
const exec = require('child_process');

const app = new express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

var config = {
    config_name: '0001-config-site',
    server_addr: 'localhost',
    doc_root: '/var/www/html',
    fastcgi_pass: 'unix:/var/run/php/php7.4-fpm.sock'
}

function generate() {
    let generatedConfig = {};
    generatedConfig.config_name = config.config_name+config.server_addr+'-'+random(10_000, 100_000);
    generatedConfig.server_addr = config.server_addr;
    generatedConfig.doc_root = config.doc_root;
    generatedConfig.fastcgi_pass = config.fastcgi_pass;
    return generatedConfig;
}

function generateConfigFile(data) {
    let $raw_template = `
        server {
            listen 80 default_server;
            listen [::]:80 default_server;
            root {{DOC_ROOT}};
            index index.html index.htm index.nginx-debian.html;
            server_name {{SERVER_ADDR}};

            location / {
                try_files $uri $uri/ =404;
            }

            location ~ \.php$ {
                include snippets/fastcgi-php.conf;
                fastcgi_pass {{FAST_CGI_PASS}}
            }
        }
    `;
    $raw_template = $raw_template.replace('{{DOC_ROOT}}', data.doc_root);
    $raw_template = $raw_template.replace('{{SERVER_ADDR}}', data.server_addr);
    $raw_template = $raw_template.replace('{{FAST_CGI_PASS}}', data.fastcgi_pass);
    return $raw_template;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.route('/generate')
.post((req, res) => {
    _.merge(config, req.body);
    console.log(config);
    console.log(req.body);

    let generated_config = generate();
    let raw_config = generateConfigFile(generated_config);
    exec.exec('whoami');

    const formattedJSON = JSON.stringify({ raw_config, generated_config }, null, 2).replace(/\\n/g, '\n');

    res.set('Content-Type', 'application/json');
    // res.json({ raw_config: raw_config, generated_config: generated_config });
    res.send(formattedJSON);
})
.get((req, res) => {
    let generated_config = generate();
    let raw_config = generateConfigFile(generated_config);

    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify({ raw_config, generated_config }, null, 2).replace(/\\n/g, '\n'));
});

app.listen(3333, () => {
    console.log('listening on localhost:3333');
});