# china/ — roteiro encriptado

`../index.html` é gerado por `rebuild.js`. Contém a app inteira (HTML + CSS + JS
+ dados) encriptada com **AES-256-GCM**, com a chave derivada da palavra-passe
por **PBKDF2-SHA256, 310 000 iterações**. O browser desencripta com WebCrypto
depois de introduzires a palavra-passe; sem ela o ficheiro é ruído.

Os **ficheiros originais em claro ficam fora deste repositório**, em
`~/Downloads/china/viagem/` — não os metas aqui, senão o roteiro passa a estar
público ao lado da versão encriptada.

## Regerar (depois de editar `data.js`, ou para mudar a palavra-passe)

    cd ~/fisioViajante/githubpages/bcasella.github.io/china
    node _build/rebuild.js ~/Downloads/china/viagem 'a-palavra-passe'
    git add index.html && git commit -m "update china" && git push

Cada build gera salt e IV novos, por isso o `index.html` muda por inteiro em
cada regeneração — é normal.

## Notas

- `_build/` começa por `_`, por isso o Jekyll do GitHub Pages não o publica.
- O GitHub Pages é estático: não há servidor para validar uma palavra-passe, daí
  a encriptação do próprio conteúdo em vez de um `if (senha === ...)` em JS.
- Quem desbloquear com "Guardar neste dispositivo" fica com a palavra-passe no
  `localStorage` desse browser, para não a ter de escrever a cada visita.
- Os checkboxes de "feito" continuam no `localStorage`, agora sob o domínio do
  site (`china2026.feito`) em vez de `file://`.
