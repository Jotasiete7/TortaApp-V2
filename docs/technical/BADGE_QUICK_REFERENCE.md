# 🎨 Badge Creation - Quick Reference

**Guia rápido para gerar badges no Leonardo.ai**

---

## ⚙️ Configurações Leonardo.ai

```
Modelo:        Leonardo Phoenix
Aspect Ratio:  1:1 (Square)
Resolution:    High
Prompt Magic:  ON
Alchemy:       ON
Images:        4
```

---

## 🔄 Workflow em 8 Passos

### 1️⃣ Abrir Leonardo.ai
- Login → Image Generation → Modelo Phoenix → 1:1

### 2️⃣ Copiar Prompt
- Ver `BADGE_DESIGN_MASTER.md` seção 6
- Copiar prompt da badge desejada

### 3️⃣ Gerar
- Colar prompt → Verificar config → Generate
- Aguardar 30-60s

### 4️⃣ Selecionar
- Escolher melhor das 4 variações
- Critérios: claro, bordado, cores corretas

### 5️⃣ Download
- Clicar imagem → Download
- Salvar como `{slug}_original.png`

### 6️⃣ Processar
- Photopea.com (grátis)
- Remover fundo → 128x128px → Export PNG

### 7️⃣ Otimizar
- TinyPNG.com
- Upload → Download
- Verificar < 50KB

### 8️⃣ Implementar
- Renomear `{slug}.png`
- Mover para `public/badges/`
- Testar → Commit

---

## 🎨 Cores por Raridade

| Raridade | Hex | Uso |
|----------|-----|-----|
| Legendary | `#FFD700` | 1000+ trades |
| Epic | `#F59E0B` | 500+ |
| Rare | `#9333EA` | 100+ |
| Uncommon | `#10B981` | 50+ |
| Common | `#3B82F6` | 10+ |
| Starter | `#64748B` | 1+ |

---

## ✅ Checklist Rápido

```
- [ ] Config Leonardo OK (1:1, High, Phoenix)
- [ ] Prompt copiado
- [ ] 4 variações geradas
- [ ] Melhor selecionada
- [ ] Download feito
- [ ] Fundo removido
- [ ] 128x128px
- [ ] < 50KB
- [ ] {slug}.png
- [ ] Em public/badges/
- [ ] Testado
```

---

## 🔧 Problemas Comuns

**Não aparece no app:**
- Verificar nome = slug exato
- Confirmar em `public/badges/`

**Pixelizada:**
- Regenerar maior resolução
- Menos compressão

**Muito grande:**
- TinyPNG novamente
- PNG-8 se necessário

**Fundo não transparente:**
- Photopea → remover fundo
- Export PNG com alpha

---

## 🔗 Links Rápidos

- **Leonardo.ai:** https://leonardo.ai
- **Photopea:** https://photopea.com
- **TinyPNG:** https://tinypng.com
- **Prompts Completos:** Ver `BADGE_DESIGN_MASTER.md`

---

## 📋 Lista de Slugs

```
first_trade, trader_novice, active_seller, bargain_hunter,
price_expert, merchant_king, tycoon_level_5, night_owl,
early_bird, christmas_trader, new_year_boom, spooky_merchant,
seller_peddler, seller_shopkeeper, seller_merchant,
seller_wholesaler, seller_tycoon, buyer_scavenger,
buyer_seeker, buyer_collector, buyer_investor, buyer_shark,
pioneer_founder, verdant_vicar, fallback
```

---

**Status:** 1/25 badges completas (First Steps ✅)  
**Próxima:** Trader Novice
