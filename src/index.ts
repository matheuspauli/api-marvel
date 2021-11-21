import express, { Request, Response, NextFunction } from "express";
import 'dotenv/config'
import axios from 'axios';
import md5 from 'md5'; 

//01:03:00 -- Inicio do front = Integração front/back - Terceiro video
const privateKey = "ac760c72114733d0a692ddabe6b9992c858c8a96";
const publicKey = "5b6dbac4044b4526dff676a534af2332";
const apiUrl = "http://gateway.marvel.com/v1/public";

const app = express();

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`started server on PORT:${port} `);
});

app.use(express.json());
//Rota para buscar personagens na base de dados (limite de personagens por paginas, e a atual pagina lida)
app.get('/personagens', (req: Request, res: Response, next: NextFunction) => {
    //Limit não pode ser < 1 || > 100
    //Chave de acesso para comunicar com o servidor da Marvel
    const { limit, page } = req.query;
    const ts = new Date().getTime().toString();
    const hash = md5(ts + privateKey + publicKey);
    //---------------------------------------------------------------
    //Acesso ao servidor,
    axios.get(`${apiUrl}/characters`, {
        params: {
            ts: ts,
            apikey: publicKey,
            hash: hash,
            orderBy: 'name',
            limit: limit,
            offset: (Number(page) - 1) * Number(limit)
        }
        //---------------------------------------------------------------
        //Informações recuperadas de TODOS personagens
    }).then((response => {
        const personagens: Array<any> = response.data.data.results;
        //---------------------------------------------------------------
        //Filtro dos personagens, retornando apenas seus nomes, IDS e imagem;
        const info: Array<any> = personagens.map(personagem => {
            return {
                nome: personagem.name,
                id: personagem.id,
                img: personagem.thumbnail.path +"." + personagem.thumbnail.extension
            }
        });
        const objRetorno = {
            page: Number(page) + 1,
            count: info.length,
            totalPages: Math.floor((response.data.data.total / Number(limit)) + 1),
            personagens: [...info]
        };
        res.json(objRetorno);
    })).catch(err => {
        console.log(err);
        res.status(500).send("Internal error");
    })
})

app.get('/personagem/:id', (req: Request, res: Response, next: NextFunction) => {
    //Limit não pode ser < 1 || > 100
    const charId = Number(req.params.id)
    const ts = new Date().getTime().toString();
    const hash = md5(ts + privateKey + publicKey);
    // GET /v1/public/characters/{characterId}/comics
    axios.get(`${apiUrl}/characters/${charId}`, {
        params: {
            ts: ts,
            apikey: publicKey,
            hash: hash,
        }
    }).then((response => {
        const personagens: Array<any> = response.data.data.results;
        const nomes: Array<any> = personagens.map(personagem => {
            return {
                nome: personagem.name,
                id: personagem.id,
                desc: personagem.description,
                img: personagem.thumbnail,
            }
        });
        const objRetorno = {
            count: nomes.length,
            personagens: [...nomes]
        };
        let path: string = objRetorno.personagens[0].img.path;
        let type: string = objRetorno.personagens[0].img.extension;
        // -------------------------------------------------------------------------------------
        axios.get(`${apiUrl}/characters/${charId}/comics`, {
            params: {
                ts: ts,
                apikey: publicKey,
                hash: hash,
            }
        }).then((response => {
            const comicsCharacer: Array<any> = response.data.data.results;
    
            const comicsCharacerFiltred: Array<any> = comicsCharacer.map(comicsCharacer => {
                return {
                    title: comicsCharacer.title,
                    id: comicsCharacer.id,
                    caminho: comicsCharacer.thumbnail
    
                }});
                console.log(comicsCharacerFiltred.length)

                let comicImgPath: string = comicsCharacerFiltred[1].caminho.path;
                let comicImgExt: string = comicsCharacerFiltred[1].caminho.extension;
                let ImgComic: string = comicImgPath + "." + comicImgExt;
            // const objRetorno = {
            //     count: nomes.length,
            //     personagens: [...nomes]
            // };
            // let path: string = objRetorno.personagens[0].caminho.path;
            // let type: string = objRetorno.personagens[0].caminho.extension;
            
            res.send(
                `<h1>Nome:${objRetorno.personagens[0].nome}</h1>
                <p>ID:${objRetorno.personagens[0].id}</p>
                <p>Descrição:${objRetorno.personagens[0].desc}</p>
                <img src="${path}.${type}" width="150px">
                </br>
                <img src="${ImgComic}" width="150px">
                <p>${comicsCharacerFiltred[1].title}</p>`)
            
        })).catch(err => {
            console.log(err);
            res.status(500).send("Internal error");
        })

    })).catch(err => {
        console.log(err);
        res.status(500).send("Internal error");
    })
})






