
export type Language = 'en' | 'pt';

export const translations = {
    en: {
        // Sidebar
        overview: 'Overview',
        tradeMaster: 'Trade Master',
        chartsEngine: 'Charts Engine',
        mlPredictor: 'ML Predictor',
        priceManager: 'Price Manager',
        settings: 'Settings',
        analyticsModule: 'Analytics Module',

        // Dashboard
        dashboardOverview: 'Dashboard Overview',
        realTimeStats: 'Real-time stats from uploaded logs',
        dataLoaded: 'Data Loaded',
        awaitingData: 'Awaiting Data',
        totalVolume: 'Total Trade Volume',
        itemsIndexed: 'Items Indexed',
        avgPrice: 'Avg. Item Price',
        systemStatus: 'System Status',
        recentLogs: 'Recent System Logs',
        quickActions: 'Quick Actions',
        uploadDump: 'Upload Data Dump',
        processing: 'Processing...',
        uploadHint: 'Import .txt / .csv',
        active: 'Active',
        idle: 'Idle',
        mlReady: 'ML Ready',
        noData: 'No Data',

        // Upload Section
        uploadLog: 'Upload Log File',
        uploadLogDesc: 'Upload your Wurm Online console log to analyze trade data.',

        // Settings
        appSettings: 'Application Settings',
        language: 'Language / Idioma',
        dataSource: 'Data Source',
        version: 'Version',

        // Common
        loading: 'Loading...',

        // Login (New)
        subtitle: 'Market Analytics for Wurm Online',
        firstTime: 'First time here?',
        firstTimeDesc: 'After creating your account, you will receive a confirmation email. Click the link to activate.',
        emailLabel: 'Email',
        passwordLabel: 'Password',
        minChars: 'Minimum 6 characters',
        createAccount: '✨ Create Account',
        signIn: '🎯 Sign In',
        forgotPassword: 'Forgot password?',
        resetInstructions: 'To reset your password:',
        resetStep1: 'Contact support',
        resetStep2: 'Or use "Forgot Password" in Supabase',
        haveAccount: '🎯 Already have an account? Sign In',
        noAccount: '✨ No account? Create one now',
        orContinue: 'Or continue with',
        googleSignIn: 'Sign in with Google',
        terms: 'By signing in, you agree to our Terms of Service',
        manualLogin: 'Login Issues? Manual Entry',
        authSuccess: '✅ Account created! Verify your email.',
        authFail: 'Authentication failed',
        invalidCreds: '❌ Invalid email or password.',
        emailNotConfirmed: '⚠️ Email not confirmed. Check your inbox.'
    },
    pt: {
        // Sidebar
        overview: 'Visão Geral',
        tradeMaster: 'Mestre de Trocas',
        chartsEngine: 'Gráficos',
        mlPredictor: 'Preditor IA',
        priceManager: 'Gerenciador de Preços',
        settings: 'Configurações',
        analyticsModule: 'Módulo de Análise',

        // Dashboard
        dashboardOverview: 'Visão Geral do Painel',
        realTimeStats: 'Estatísticas em tempo real dos logs',
        dataLoaded: 'Dados Carregados',
        awaitingData: 'Aguardando Dados',
        totalVolume: 'Volume Total de Trocas',
        itemsIndexed: 'Itens Indexados',
        avgPrice: 'Preço Médio',
        systemStatus: 'Status do Sistema',
        recentLogs: 'Logs Recentes',
        quickActions: 'Ações Rápidas',
        uploadDump: 'Carregar Arquivo',
        processing: 'Processando...',
        uploadHint: 'Importar .txt / .csv',
        active: 'Ativo',
        idle: 'Ocioso',
        mlReady: 'IA Pronta',
        noData: 'Sem Dados',

        // Upload Section
        uploadLog: 'Carregar Arquivo de Log',
        uploadLogDesc: 'Carregue seu log do console Wurm Online para analisar dados de troca.',

        // Settings
        appSettings: 'Configurações do Aplicativo',
        language: 'Language / Idioma',
        dataSource: 'Fonte de Dados',
        version: 'Versão',

        // Common
        loading: 'Carregando...',

        // Login (New)
        subtitle: 'Análise de Mercado para Wurm Online',
        firstTime: 'Primeira vez aqui?',
        firstTimeDesc: 'Após criar sua conta, você receberá um email de confirmação. Clique no link para ativar sua conta.',
        emailLabel: 'Email',
        passwordLabel: 'Senha',
        minChars: 'Mínimo de 6 caracteres',
        createAccount: '✨ Criar Conta',
        signIn: '🎯 Entrar',
        forgotPassword: 'Esqueceu a senha?',
        resetInstructions: 'Para resetar sua senha:',
        resetStep1: 'Entre em contato com o suporte',
        resetStep2: 'Ou use a opção "Esqueci a senha" no Supabase',
        haveAccount: '🎯 Já tem uma conta? Entrar',
        noAccount: '✨ Não tem conta? Criar agora',
        orContinue: 'Ou continue com',
        googleSignIn: 'Entrar com Google',
        terms: 'Ao entrar, você concorda com nossos Termos de Serviço',
        manualLogin: 'Problemas no Login? Entrar Manualmente',
        authSuccess: '✅ Conta criada! Verifique seu email.',
        authFail: 'Falha na autenticação',
        invalidCreds: '❌ Email ou senha incorretos.',
        emailNotConfirmed: '⚠️ Email não confirmado. Verifique sua caixa de entrada.'
    }
};
