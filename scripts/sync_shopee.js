// Script to fetch real products from Shopee vitrine https://collshp.com/lagarelli180 and output SQL
import fs from 'fs';

async function generateSql() {
  const query = `
    query getLinkLists($urlSuffix: String!, $pageSize: String, $pageNum: String) {
      landingPageLinkList(urlSuffix: $urlSuffix, pageSize: $pageSize, pageNum: $pageNum) {
        linkList {
          linkId
          link
          linkName
          image
        }
      }
    }
  `;

  const res = await fetch("https://collshp.com/api/v3/gql/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operationName: "getLinkLists",
      query,
      variables: { urlSuffix: "lagarelli180", pageSize: "100", pageNum: "1" }
    })
  });
  const data = await res.json();
  const list = data.data.landingPageLinkList.linkList;

  function slugify(text) {
    return text.toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function getCategory(title) {
    const t = title.toLowerCase();
    if (t.includes("café") || t.includes("cafe")) return "Cafés & Gourmet";
    if (t.includes("doce") || t.includes("cocada") || t.includes("goiabada") || t.includes("queijo") || t.includes("provolone") || t.includes("coqueteis")) return "Doces & Queijos Mineiros";
    if (t.includes("perfume") || t.includes("esmalte")) return "Beleza & Perfumaria";
    if (t.includes("copo") || t.includes("garrafa") || t.includes("caneca") || t.includes("moedor") || t.includes("borrifador") || t.includes("spray")) return "Utensílios & Café";
    return "Gourmet & Achados";
  }

  function getPrices(title, index) {
    const t = title.toLowerCase();
    if (t.includes("kit3") || t.includes("coqueteis")) return { orig: 89.90, disc: 59.90, desc: "Kit com 3 coquetéis cremosos sabor Marula, Chocolate e Chocolate Branco." };
    if (t.includes("parmesão") || t.includes("parmesao")) return { orig: 79.90, disc: 49.90, desc: "Queijo tipo Parmesão curado artesanal mineiro de sabor marcante para massas e petiscos." };
    if (t.includes("provolone")) return { orig: 69.90, disc: 45.90, desc: "Kit Provolone Provoleto autêntico da Serra da Canastra defumado." };
    if (t.includes("perfumes")) return { orig: 149.90, disc: 89.90, desc: "Combo com 3 perfumes masculinos com alta fixação e projeção marcante." };
    if (t.includes("garrafa térmica") || t.includes("garrafa termica")) return { orig: 99.90, disc: 58.90, desc: "Garrafa térmica Verona com sistema de pressão para café e chá quente." };
    if (t.includes("orfeu")) return { orig: 42.00, disc: 29.90, desc: "Café especial premiado 100% Arábica Orfeu, torrado e moído com notas equilibradas." };
    if (t.includes("moedor")) return { orig: 89.90, disc: 49.90, desc: "Moedor elétrico multifuncional com lâminas de aço inox para moagem rápida." };
    if (t.includes("caneca misturadora")) return { orig: 59.90, disc: 34.90, desc: "Caneca automática que mistura café, leite e suplementos com 1 toque." };
    if (t.includes("display led")) return { orig: 69.90, disc: 38.90, desc: "Copo térmico inteligente com sensor de temperatura em display LED touch." };
    if (t.includes("baggio")) return { orig: 39.90, disc: 26.90, desc: "Café aromático Baggio com toque aveludado de chocolate trufado." };
    if (t.includes("rocca")) return { orig: 45.00, disc: 32.90, desc: "Autêntico doce de leite mineiro Rocca harmonizado com café especial." };
    if (t.includes("aviação") || t.includes("aviacao")) return { orig: 36.00, disc: 24.90, desc: "Tradicional doce de leite Aviação cremoso de altíssima qualidade." };
    if (t.includes("spray") || t.includes("borrifador")) return { orig: 39.90, disc: 21.90, desc: "Pulverizador prático para óleo, azeite e vinagre com dosagem perfeita." };
    if (t.includes("doce") || t.includes("cocada")) return { orig: 38.00, disc: 24.90, desc: "Doce tradicional da fazenda preparado com receita artesanal mineira." };
    if (t.includes("café") || t.includes("cafe")) return { orig: 35.00, disc: 22.90, desc: "Café artesanal 100% arábica com aroma intenso e notas doces naturais." };
    if (t.includes("copo") || t.includes("caneca")) return { orig: 59.00, disc: 34.90, desc: "Copo térmico em inox com isolamento a vácuo para bebidas quentes e geladas." };
    return { orig: 49.90, disc: 29.90, desc: "Produto selecionado com excelente avaliação e envio rápido pela Shopee." };
  }

  const values = list.map((item, idx) => {
    const slug = slugify(item.linkName) + "-" + item.linkId;
    const cat = getCategory(item.linkName);
    const { orig, disc, desc } = getPrices(item.linkName, idx);
    const pct = Math.round(((orig - disc) / orig) * 100);
    const isFlash = idx < 8;
    const isFeat = idx < 16;
    const rating = (4.8 + ((idx % 3) * 0.1)).toFixed(1);
    const reviews = 350 + (idx * 145);
    const coupon = (idx % 2 === 0) ? "MINEIRO10" : "SHOPEEFRETE";

    const escapeSql = (str) => "'" + str.replace(/'/g, "''") + "'";

    return `(
      ${escapeSql(item.linkName)},
      ${escapeSql(slug)},
      ${escapeSql(desc)},
      ${escapeSql(item.image)},
      ${orig.toFixed(2)},
      ${disc.toFixed(2)},
      ${pct},
      '2x de R$ ${(disc / 2).toFixed(2).replace(".", ",")} sem juros',
      ${escapeSql(item.link)},
      'shopee',
      ${escapeSql(cat)},
      'publicado',
      ${isFeat},
      ${isFlash},
      ${rating},
      ${reviews},
      '${coupon}',
      ${3000 + idx * 450},
      ${800 + idx * 110},
      timezone('utc'::text, now() + interval '10 days')
    )`;
  });

  const sql = `DELETE FROM public.produtos_ofertas WHERE platform = 'shopee';

INSERT INTO public.produtos_ofertas 
(title, slug, description, image_url, original_price, discount_price, discount_percentage, installments, affiliate_url, platform, category, status, is_featured, is_flash_deal, rating, reviews_count, coupon_code, views_count, clicks_count, expires_at)
VALUES
${values.join(",\n")};`;

  fs.writeFileSync("seed_shopee_real.sql", sql);
  console.log("SQL file generated successfully with", list.length, "real products!");
}

generateSql().catch(console.error);
