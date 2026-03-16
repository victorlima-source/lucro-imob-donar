
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'imobiliaria');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imobiliaria_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  valor_imovel DECIMAL NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('apto', 'casa', 'comercial')),
  premio_total DECIMAL NOT NULL,
  valor_liquido DECIMAL NOT NULL,
  comissao_imob DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Cotação', 'Emitido')),
  contrato_url TEXT,
  apolice_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Imobiliárias can view own requests" ON public.requests FOR SELECT USING (auth.uid() = imobiliaria_id);
CREATE POLICY "Imobiliárias can insert own requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = imobiliaria_id);
CREATE POLICY "Imobiliárias can update own requests" ON public.requests FOR UPDATE USING (auth.uid() = imobiliaria_id);
CREATE POLICY "Admins can view all requests" ON public.requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all requests" ON public.requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  -- Default role is imobiliaria
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'imobiliaria');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('contratos', 'contratos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('apolices', 'apolices', false);

CREATE POLICY "Users can upload contratos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'contratos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own contratos" ON storage.objects FOR SELECT USING (bucket_id = 'contratos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all contratos" ON storage.objects FOR SELECT USING (bucket_id = 'contratos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can upload apolices" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'apolices' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own apolices" ON storage.objects FOR SELECT USING (bucket_id = 'apolices' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all apolices" ON storage.objects FOR SELECT USING (bucket_id = 'apolices' AND public.has_role(auth.uid(), 'admin'));
