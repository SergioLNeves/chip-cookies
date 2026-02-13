.PHONY: clean build pack help

# Limpa build anterior e .tgz antigos
clean:
	npm run clean
	rm -f *.tgz

# Compila TypeScript (src/ -> build/)
build:
	npm run build

# Gera o .tgz atualizado (package.json já deve estar com a versão correta)
pack: clean build
	npm pack

help:
	@echo "Uso:"
	@echo "  make clean  - Remove build/ e .tgz antigos"
	@echo "  make build  - Compila TypeScript"
	@echo "  make pack   - clean + build + gera .tgz"
	@echo ""
	@echo "Antes de rodar, atualize a versão no package.json"
