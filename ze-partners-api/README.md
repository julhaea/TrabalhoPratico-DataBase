API para gerenciamento de parceiros com geolocalização, permitindo:
-Cadastro de parceiros com área de cobertura
-Busca por ID
-Encontrar o parceiro mais próximo de uma localização

Passo a Passo

1.Clone o repositório no terminal

    git clone https://github.com/seu-usuario/ze-partners-api.git
    cd ze-partners-api

2.Instale as dependências no terminal

    npm install

3.Configure o banco de dados

    -Execute o script SQL:
        CREATE DATABASE ze_partners;
        USE ze_partners;
        CREATE TABLE partners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tradingName VARCHAR(255) NOT NULL,
        ownerName VARCHAR(255) NOT NULL,
        document VARCHAR(255) NOT NULL UNIQUE,
        coverageArea GEOMETRY NOT NULL SRID 4326,
        address POINT NOT NULL SRID 4326,
        SPATIAL INDEX(coverageArea),
        SPATIAL INDEX(address)
        );

4.Configure as credenciais

    Edite o arquivo db.js com seus dados (host, user, password e database).

5.Inicie o servidor no terminal

    npm start

6.Acesse a API
    
    http://localhost:3000