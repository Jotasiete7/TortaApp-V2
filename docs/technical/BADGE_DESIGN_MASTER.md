# 🎨 TortaApp Badge Design System - Master Document

**Versão:** 1.0  
**Data:** 2025-12-23  
**Status:** Documentação Completa

---

## 📋 Sumário Executivo

Este documento centraliza **TODOS** os protocolos, processos e prompts para criação e manutenção do sistema de badges do TortaApp. Nada se perde - tudo está aqui.

**Total de Badges:** 25 (24 + 1 fallback)  
**Ferramenta:** Leonardo.ai  
**Estilo:** Embroidered medieval guild patches  
**Formato:** PNG 128x128, <50KB, transparente

---

## 🎯 1. VISÃO GERAL DO SISTEMA

### Conceito Visual
- **Estética:** Medieval guild patches bordados
- **Inspiração:** Emblemas artesanais, conquistas premium de jogos
- **Qualidade:** Premium, colecionável, handcrafted

### Princípios de Design
1. **Artesanal** - Aparência de bordado 3D
2. **Icônico** - Símbolos claros, sem excesso de detalhes
3. **Consistente** - Mesmo estilo em todas as badges
4. **Escalável** - Funciona de 24px a 128px
5. **Premium** - Transmite valor e conquista

---

## 🔧 2. ESPECIFICAÇÕES TÉCNICAS

### Arquivo Final
```
Formato:     PNG com canal alpha
Dimensões:   128x128 pixels exatos
Tamanho:     < 50KB
DPI:         72
Cor:         RGB + Alpha
Fundo:       Transparente
Nome:        {slug}.png (lowercase, underscores)
```

### Estrutura de Pastas
```
TortaApp-V2/
└── public/
    └── badges/
        ├── first_trade.png
        ├── merchant_king.png
        ├── ... (23 mais)
        └── fallback.png
```

---

## 🎨 3. PALETA DE CORES OFICIAL

| Raridade | Cor | Hex | Uso |
|----------|-----|-----|-----|
| Legendary | Gold | `#FFD700` | 1000+ trades |
| Epic | Amber | `#F59E0B` | 500+ trades |
| Rare | Purple | `#9333EA` | 100+ trades |
| Uncommon | Emerald | `#10B981` | 50+ trades |
| Common | Blue | `#3B82F6` | 10+ trades |
| Starter | Slate | `#64748B` | 1+ trade |

**Cores Especiais:**
- Red `#EF4444` - Seasonal (Natal, Halloween)
- Cyan `#06B6D4` - Special (Founder)
- Rose `#FB7185` - Time-based (Night Owl)
- Orange `#F97316` - Achievements

---

## 🤖 4. WORKFLOW LEONARDO.AI (PASSO A PASSO)

### Configurações Iniciais
```
Modelo:        Leonardo Phoenix
Aspect Ratio:  1:1 (Square)
Resolution:    High (1024x1024)
Style:         Illustration
Prompt Magic:  ON
Alchemy:       ON (se disponível)
Images:        4 variações
```

### Processo Completo

#### PASSO 1: Preparar Leonardo.ai
1. Abrir https://leonardo.ai
2. Login
3. Clicar em "Image Generation"
4. Selecionar modelo **Phoenix**
5. Configurar **Aspect Ratio: 1:1**

#### PASSO 2: Copiar e Colar Prompt
1. Ir para seção "PROMPTS COMPLETOS" abaixo
2. Copiar prompt da badge desejada
3. Colar no campo de prompt do Leonardo
4. Verificar configurações (1:1, High, Prompt Magic ON)
5. Clicar em **"Generate"**

#### PASSO 3: Aguardar (30-60 segundos)
- Leonardo gera 4 variações
- Avaliar qual ficou melhor

#### PASSO 4: Selecionar Melhor Imagem
**Critérios:**
- ✅ Símbolo claro e reconhecível
- ✅ Aparência de bordado/patch
- ✅ Fundo limpo (fácil de remover)
- ✅ Cores vibrantes
- ✅ Bordas definidas
- ✅ Profundidade 3D sutil

#### PASSO 5: Download
1. Clicar na imagem escolhida (abre fullscreen)
2. Clicar botão **"Download"** (canto superior direito)
3. Salvar como: `{badge_slug}_original.png`

#### PASSO 6: Pós-Processamento
**Opção A - Photopea (online grátis):**
1. Abrir https://photopea.com
2. Upload da imagem
3. Remover fundo (Magic Wand + Delete)
4. Image > Image Size > 128x128 pixels
5. File > Export As > PNG (transparency ON)

**Opção B - Photoshop/GIMP:**
1. Abrir imagem
2. Remover fundo
3. Redimensionar para 128x128
4. Adicionar padding 10px (canvas 128x128, imagem 108x108 centralizada)
5. Export PNG com transparência

#### PASSO 7: Otimizar
1. Abrir https://tinypng.com
2. Upload da imagem
3. Download versão otimizada
4. **Verificar tamanho < 50KB**

#### PASSO 8: Finalizar
1. Renomear para `{slug}.png` (ex: `merchant_king.png`)
2. Mover para `public/badges/`
3. Testar no app
4. Commit no Git

---

## 📝 5. TEMPLATE DE PROMPT BASE

```
Create a {description} embroidered badge patch icon.
Style: Embroidered fabric patch with {color} thread, stitched edges, subtle 3D depth, soft shadows
Colors: {hex_color} with subtle shading and highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: {specific_details}
Mood: Premium, handcrafted, game achievement, collectible
```

---

## 🎯 6. PROMPTS COMPLETOS (TODAS AS 25 BADGES)

### Core Badges (7)

**1. First Steps** (`first_trade.png`)
```
Create a golden star embroidered badge patch icon.
Style: Embroidered fabric patch with yellow thread, stitched edges, subtle 3D depth, soft shadows
Colors: Bright yellow (#FBBF24) with golden highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Simple 5-point star, clean silhouette, beginner-friendly design
Mood: Premium, handcrafted, first achievement, welcoming
```

**2. Trader Novice** (`trader_novice.png`)
```
Create a silver award medal embroidered badge patch icon.
Style: Embroidered fabric patch with slate thread, stitched edges, subtle 3D depth, soft shadows
Colors: Slate gray (#64748B) with silver highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Award medal with ribbon, simple geometric design
Mood: Premium, handcrafted, beginner achievement, professional
```

**3. Active Seller** (`active_seller.png`)
```
Create an emerald shopping cart embroidered badge patch icon.
Style: Embroidered fabric patch with emerald thread, stitched edges, subtle 3D depth, soft shadows
Colors: Emerald green (#10B981) with jade highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Shopping cart silhouette, clean lines, merchant theme
Mood: Premium, handcrafted, seller achievement, prosperous
```

**4. Bargain Hunter** (`bargain_hunter.png`)
```
Create a blue trending arrow embroidered badge patch icon.
Style: Embroidered fabric patch with blue thread, stitched edges, subtle 3D depth, soft shadows
Colors: Bright blue (#3B82F6) with cyan highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Upward trending arrow, dynamic design, buyer theme
Mood: Premium, handcrafted, buyer achievement, strategic
```

**5. Price Expert** (`price_expert.png`)
```
Create a purple beaker/flask embroidered badge patch icon.
Style: Embroidered fabric patch with purple thread, stitched edges, subtle 3D depth, soft shadows
Colors: Deep purple (#9333EA) with violet highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Laboratory beaker, scientific theme, expertise symbol
Mood: Premium, handcrafted, expert achievement, analytical
```

**6. Merchant King** (`merchant_king.png`)
```
Create a golden crown embroidered badge patch icon.
Style: Embroidered fabric patch with gold thread, stitched edges, subtle 3D depth, soft shadows
Colors: Rich gold (#FFD700) with amber highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Regal 5-point crown, ornate but clean, royal symbol
Mood: Premium, handcrafted, legendary achievement, prestigious
```

**7. Tycoon** (`tycoon_level_5.png`)
```
Create an amber trophy embroidered badge patch icon.
Style: Embroidered fabric patch with amber thread, stitched edges, subtle 3D depth, soft shadows
Colors: Amber gold (#F59E0B) with orange highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Victory trophy cup, champion symbol, success theme
Mood: Premium, handcrafted, epic achievement, triumphant
```

### Seasonal Badges (5)

**8. Night Owl** (`night_owl.png`)
```
Create a purple crescent moon with owl embroidered badge patch icon.
Style: Embroidered fabric patch with purple thread, stitched edges, subtle 3D depth, soft shadows
Colors: Deep purple (#9333EA) with silver moon accents
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Crescent moon with small owl silhouette perched on it, nighttime theme
Mood: Premium, handcrafted, mysterious achievement, nocturnal
```

**9. Early Bird** (`early_bird.png`)
```
Create a yellow sunrise embroidered badge patch icon.
Style: Embroidered fabric patch with yellow thread, stitched edges, subtle 3D depth, soft shadows
Colors: Bright yellow (#FBBF24) with orange sunrise rays
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Rising sun with radiating rays, morning theme, optimistic design
Mood: Premium, handcrafted, early riser achievement, energetic
```

**10. Christmas Trader** (`christmas_trader.png`)
```
Create a red gift box embroidered badge patch icon.
Style: Embroidered fabric patch with red thread, stitched edges, subtle 3D depth, soft shadows
Colors: Festive red (#EF4444) with gold ribbon accents
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Gift box with bow, holiday theme, cheerful design
Mood: Premium, handcrafted, festive achievement, joyful
```

**11. New Year Boom** (`new_year_boom.png`)
```
Create a gold sparkles/fireworks embroidered badge patch icon.
Style: Embroidered fabric patch with gold thread, stitched edges, subtle 3D depth, soft shadows
Colors: Rich gold (#FFD700) with bright yellow sparkles
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Bursting fireworks or sparkles, celebration theme, dynamic design
Mood: Premium, handcrafted, celebratory achievement, explosive
```

**12. Spooky Merchant** (`spooky_merchant.png`)
```
Create an orange ghost embroidered badge patch icon.
Style: Embroidered fabric patch with orange thread, stitched edges, subtle 3D depth, soft shadows
Colors: Bright orange (#F97316) with dark orange shadows
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Friendly ghost silhouette, Halloween theme, playful design
Mood: Premium, handcrafted, spooky achievement, fun
```

### Seller Path (5)

**13. Peddler** (`seller_peddler.png`)
```
Create a slate tag/price tag embroidered badge patch icon.
Style: Embroidered fabric patch with slate thread, stitched edges, subtle 3D depth, soft shadows
Colors: Slate gray (#64748B) with white highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Simple price tag, beginner seller symbol, clean design
Mood: Premium, handcrafted, starter seller achievement, humble
```

**14. Shopkeeper** (`seller_shopkeeper.png`)
```
Create a blue storefront embroidered badge patch icon.
Style: Embroidered fabric patch with blue thread, stitched edges, subtle 3D depth, soft shadows
Colors: Bright blue (#3B82F6) with cyan highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Simple shop building facade, merchant theme, welcoming design
Mood: Premium, handcrafted, established seller achievement, professional
```

**15. Merchant** (`seller_merchant.png`)
```
Create an amber briefcase embroidered badge patch icon.
Style: Embroidered fabric patch with amber thread, stitched edges, subtle 3D depth, soft shadows
Colors: Amber gold (#F59E0B) with brown leather accents
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Business briefcase, professional trader symbol, sophisticated design
Mood: Premium, handcrafted, advanced seller achievement, business-like
```

**16. Wholesaler** (`seller_wholesaler.png`)
```
Create a purple shipping container embroidered badge patch icon.
Style: Embroidered fabric patch with purple thread, stitched edges, subtle 3D depth, soft shadows
Colors: Deep purple (#9333EA) with violet highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Cargo container, bulk trading symbol, industrial design
Mood: Premium, handcrafted, bulk seller achievement, industrial
```

**17. Monopoly Tycoon** (`seller_tycoon.png`)
```
Create a gold building/skyscraper embroidered badge patch icon.
Style: Embroidered fabric patch with gold thread, stitched edges, subtle 3D depth, soft shadows
Colors: Rich gold (#FFD700) with amber highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Tall building/skyscraper, empire symbol, prestigious design
Mood: Premium, handcrafted, legendary seller achievement, powerful
```

### Buyer Path (5)

**18. Scavenger** (`buyer_scavenger.png`)
```
Create a slate magnifying glass embroidered badge patch icon.
Style: Embroidered fabric patch with slate thread, stitched edges, subtle 3D depth, soft shadows
Colors: Slate gray (#64748B) with silver highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Magnifying glass, search symbol, investigative design
Mood: Premium, handcrafted, starter buyer achievement, curious
```

**19. Seeker** (`buyer_seeker.png`)
```
Create a blue binoculars embroidered badge patch icon.
Style: Embroidered fabric patch with blue thread, stitched edges, subtle 3D depth, soft shadows
Colors: Bright blue (#3B82F6) with cyan highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Binoculars, scouting symbol, explorer design
Mood: Premium, handcrafted, active buyer achievement, adventurous
```

**20. Collector** (`buyer_collector.png`)
```
Create an amber library/books embroidered badge patch icon.
Style: Embroidered fabric patch with amber thread, stitched edges, subtle 3D depth, soft shadows
Colors: Amber gold (#F59E0B) with brown book spines
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Stack of books or library, collection symbol, scholarly design
Mood: Premium, handcrafted, dedicated buyer achievement, knowledgeable
```

**21. Investor** (`buyer_investor.png`)
```
Create a purple trending chart embroidered badge patch icon.
Style: Embroidered fabric patch with purple thread, stitched edges, subtle 3D depth, soft shadows
Colors: Deep purple (#9333EA) with green profit line
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Upward trending stock chart, investment symbol, strategic design
Mood: Premium, handcrafted, strategic buyer achievement, analytical
```

**22. Market Shark** (`buyer_shark.png`)
```
Create a gold diamond/gem embroidered badge patch icon.
Style: Embroidered fabric patch with gold thread, stitched edges, subtle 3D depth, soft shadows
Colors: Rich gold (#FFD700) with cyan sparkles
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Brilliant cut diamond, luxury symbol, prestigious design
Mood: Premium, handcrafted, legendary buyer achievement, elite
```

### Special Badges (2)

**23. Founding Pioneer** (`pioneer_founder.png`)
```
Create a rose/pink flag embroidered badge patch icon.
Style: Embroidered fabric patch with rose thread, stitched edges, subtle 3D depth, soft shadows
Colors: Rose pink (#FB7185) with red highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Waving flag on pole, pioneer symbol, historic design
Mood: Premium, handcrafted, exclusive achievement, historic
```

**24. Verdant Vicar** (`verdant_vicar.png`)
```
Create an emerald sprout/seedling embroidered badge patch icon.
Style: Embroidered fabric patch with emerald thread, stitched edges, subtle 3D depth, soft shadows
Colors: Emerald green (#10B981) with jade leaf details
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Young plant sprout with leaves, growth symbol, unique first-user design
Mood: Premium, handcrafted, unique achievement, legendary
```

### Fallback Badge

**25. Fallback** (`fallback.png`)
```
Create a generic silver badge embroidered patch icon.
Style: Embroidered fabric patch with silver thread, stitched edges, subtle 3D depth, soft shadows
Colors: Silver gray (#94A3B8) with white highlights
Background: Transparent PNG
Size: 128x128 pixels, centered, with 10px padding
Details: Simple circular badge with question mark or generic symbol
Mood: Premium, handcrafted, placeholder design, neutral
```

---

## ✅ 7. CHECKLIST DE VALIDAÇÃO

### Por Badge
```
- [ ] Prompt copiado corretamente
- [ ] Gerado no Leonardo.ai (4 variações)
- [ ] Melhor imagem selecionada
- [ ] Download realizado
- [ ] Fundo removido (transparente)
- [ ] Redimensionado 128x128px
- [ ] Otimizado < 50KB
- [ ] Renomeado {slug}.png
- [ ] Movido para public/badges/
- [ ] Testado no app
- [ ] Commit no Git
```

### Qualidade Visual
```
- [ ] Símbolo claro em 24px
- [ ] Aparência de bordado
- [ ] Profundidade 3D sutil
- [ ] Cores corretas (hex code)
- [ ] Bordas definidas
- [ ] Fundo transparente
```

---

## 🚀 8. EXPANSÃO FUTURA

### Para Adicionar Nova Badge

1. **Planejar:**
   - Nome, slug, descrição
   - Raridade e cor (usar paleta)
   - Símbolo e critério

2. **Banco de Dados:**
```sql
INSERT INTO badges (slug, name, description, icon_name, color)
VALUES ('nova_badge', 'Nova Badge', 'Descrição', 'icon', '#HEX');
```

3. **Gerar Prompt:**
   - Usar template base
   - Preencher cor, hex, símbolo, detalhes

4. **Seguir Workflow:**
   - Leonardo.ai → Download → Processar → Otimizar → Implementar

5. **Documentar:**
   - Adicionar prompt neste documento
   - Atualizar contagem total

---

## 🔧 9. TROUBLESHOOTING

### Badge não aparece
- Verificar nome do arquivo = slug exato
- Confirmar em `public/badges/`
- Testar URL: `http://localhost:5173/badges/{slug}.png`

### Badge pixelizada
- Regenerar em resolução maior
- Reduzir compressão

### Badge muito grande
- Otimizar no TinyPNG
- Verificar metadados desnecessários

### Fundo não transparente
- Usar Photopea/Photoshop para remover
- Exportar PNG com alpha channel

---

## 📚 10. FERRAMENTAS E RECURSOS

### Essenciais
- **Leonardo.ai:** https://leonardo.ai (geração)
- **TinyPNG:** https://tinypng.com (otimização)
- **Photopea:** https://photopea.com (edição online grátis)

### Opcionais
- **Remove.bg:** https://remove.bg (remover fundo)
- **Squoosh:** https://squoosh.app (compressão)
- **Coolors:** https://coolors.co (paleta de cores)

---

## 📊 11. STATUS DO PROJETO

**Badges Geradas:** 1/25 (First Steps ✅)  
**Próximas:** Trader Novice, Active Seller, Bargain Hunter...  
**Meta:** 25/25 completas

---

**🎯 OBJETIVO FINAL:** Ter todas as 25 badges geradas, otimizadas e implementadas, com processo totalmente documentado para expansão futura.

**Documento mantido por:** Design Team + AI Assistants  
**Última atualização:** 2025-12-23
