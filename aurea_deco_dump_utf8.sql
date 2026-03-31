--
-- PostgreSQL database dump
--

\restrict L6Re9GU2iy0uROlZgFolwoQiqziOOhMs7NzIfRARGE5XXklqEORjeNqxLa7pV97

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE aurea_deco;
--
-- Name: aurea_deco; Type: DATABASE; Schema: -; Owner: postgres
--




\unrestrict L6Re9GU2iy0uROlZgFolwoQiqziOOhMs7NzIfRARGE5XXklqEORjeNqxLa7pV97
\restrict L6Re9GU2iy0uROlZgFolwoQiqziOOhMs7NzIfRARGE5XXklqEORjeNqxLa7pV97

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_settings OWNER TO postgres;

--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_settings_id_seq OWNER TO postgres;

--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_items (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(100),
    dimension character varying(100),
    size character varying(50),
    quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url character varying(500),
    price numeric(10,2) DEFAULT NULL::numeric
);


ALTER TABLE public.inventory_items OWNER TO postgres;

--
-- Name: COLUMN inventory_items.price; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inventory_items.price IS 'Default unit price (DA) when this item is added to an order; user can override in the order form.';


--
-- Name: inventory_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_items_id_seq OWNER TO postgres;

--
-- Name: inventory_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_items_id_seq OWNED BY public.inventory_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    client_name character varying(255),
    phone character varying(50),
    address text,
    status character varying(50) DEFAULT 'Nouvelle commande'::character varying,
    assigned_designer integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    first_name character varying(100),
    last_name character varying(100),
    phone2 character varying(20),
    wilaya character varying(100),
    commune character varying(100),
    delivery_type character varying(50) DEFAULT 'domicile'::character varying,
    stop_desk_agency character varying(100),
    is_free_delivery boolean DEFAULT false,
    has_exchange boolean DEFAULT false,
    has_insurance boolean DEFAULT false,
    declared_value numeric(10,2),
    delivery_fee numeric(10,2) DEFAULT 0,
    discount numeric(10,2) DEFAULT 0,
    source character varying(50) DEFAULT 'admin'::character varying,
    versement numeric(10,2) DEFAULT 0
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: COLUMN orders.delivery_fee; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.delivery_fee IS 'Frais de livraison (DA) - 0 if is_free_delivery';


--
-- Name: COLUMN orders.discount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.discount IS 'Remise (DA) applied to invoice total';


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.photos (
    id integer NOT NULL,
    order_id integer,
    filename character varying(255) NOT NULL,
    type character varying(50) DEFAULT 'client'::character varying NOT NULL,
    uploaded_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.photos OWNER TO postgres;

--
-- Name: photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.photos_id_seq OWNER TO postgres;

--
-- Name: photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.photos_id_seq OWNED BY public.photos.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    order_id integer,
    type character varying(100) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'En attente'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url character varying(500)
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: stock_product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_product_variants (
    id integer NOT NULL,
    product_id integer,
    color character varying(100),
    size character varying(50),
    dimension character varying(100),
    quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stock_product_variants OWNER TO postgres;

--
-- Name: stock_product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_product_variants_id_seq OWNER TO postgres;

--
-- Name: stock_product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_product_variants_id_seq OWNED BY public.stock_product_variants.id;


--
-- Name: stock_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stock_products OWNER TO postgres;

--
-- Name: stock_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_products_id_seq OWNER TO postgres;

--
-- Name: stock_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_products_id_seq OWNED BY public.stock_products.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'designer'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: inventory_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos ALTER COLUMN id SET DEFAULT nextval('public.photos_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: stock_product_variants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_product_variants ALTER COLUMN id SET DEFAULT nextval('public.stock_product_variants_id_seq'::regclass);


--
-- Name: stock_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_products ALTER COLUMN id SET DEFAULT nextval('public.stock_products_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.company_settings VALUES (1, 'company_name', 'AUREA DECO', '2026-03-15 15:37:08.581452', '2026-03-15 15:40:52.584865');
INSERT INTO public.company_settings VALUES (2, 'vendor_name', 'MOSEFAOUI NESRINE', '2026-03-15 15:37:08.581452', '2026-03-15 15:40:52.599085');
INSERT INTO public.company_settings VALUES (3, 'activity', 'Artisan en impression sur divers supports', '2026-03-15 15:37:08.581452', '2026-03-15 15:40:52.601204');
INSERT INTO public.company_settings VALUES (4, 'address', 'Sour El Ghozlane ΓÇô Bouira', '2026-03-15 15:37:08.581452', '2026-03-15 15:40:52.60305');
INSERT INTO public.company_settings VALUES (5, 'phone', '07 75 96 07 56', '2026-03-15 15:37:08.581452', '2026-03-15 15:40:52.604889');


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.inventory_items VALUES (9, 'Couvre', 'Noir', NULL, NULL, 4, '2026-03-14 17:25:40.879851', '2026-03-15 15:20:05.828781', 'https://res.cloudinary.com/dxchqitkp/image/upload/v1773505540/aurea-deco-uploads/lrw2vny4dnmgagvahyd6.jpg', NULL);
INSERT INTO public.inventory_items VALUES (7, 'Drap', 'Grenat', NULL, NULL, 0, '2026-03-14 16:10:13.404128', '2026-03-17 01:11:24.532523', NULL, NULL);
INSERT INTO public.inventory_items VALUES (10, 'Couvre', 'Noir', NULL, NULL, 0, '2026-03-14 17:25:43.903645', '2026-03-17 01:21:00.013234', 'https://res.cloudinary.com/dxchqitkp/image/upload/v1773505543/aurea-deco-uploads/vo4ocauq05ssxlmtzxab.jpg', NULL);
INSERT INTO public.inventory_items VALUES (4, 'Couvre', 'Rose', '30*50', NULL, 1, '2026-03-14 16:09:05.52837', '2026-03-19 00:13:47.547097', NULL, NULL);
INSERT INTO public.inventory_items VALUES (5, 'Drap', 'Blanc', NULL, NULL, 0, '2026-03-14 16:09:33.232985', '2026-03-19 01:47:42.889803', NULL, NULL);
INSERT INTO public.inventory_items VALUES (3, 'Drap ', 'Rose', NULL, NULL, 0, '2026-03-14 16:08:43.855005', '2026-03-22 00:01:34.512269', NULL, NULL);
INSERT INTO public.inventory_items VALUES (6, 'Couvre', 'Grenat', '40*40', NULL, 2, '2026-03-14 16:09:57.777522', '2026-03-22 23:53:54.067447', NULL, NULL);
INSERT INTO public.inventory_items VALUES (12, 'Couvre ', 'Noir', NULL, NULL, 7, '2026-03-19 01:00:44.385141', '2026-03-24 22:02:43.455065', NULL, NULL);
INSERT INTO public.inventory_items VALUES (11, 'Couvre', 'Blue', NULL, NULL, 6, '2026-03-14 17:54:31.986637', '2026-03-24 22:03:24.581646', NULL, NULL);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.orders VALUES (31, 'r f', '066666666', 'Sur place', 'Nouvelle commande', NULL, '2026-03-22 23:53:54.067447', '2026-03-22 23:53:54.067447', 'r', 'f', NULL, 'Atelier', 'Atelier', 'sur_place', NULL, true, false, false, NULL, 0.00, 0.00, 'atelier', 2000.00);
INSERT INTO public.orders VALUES (32, 'd w', '066666666', '18000', 'Nouvelle commande', NULL, '2026-03-24 22:02:43.455065', '2026-03-24 22:02:43.455065', 'd', 'w', NULL, 'Jijel', 'Jijel', 'domicile', NULL, false, false, false, NULL, 1000.00, 0.00, 'admin', 0.00);
INSERT INTO public.orders VALUES (33, 'r w', '06666666', 'Sur place', 'Nouvelle commande', NULL, '2026-03-24 22:03:24.581646', '2026-03-24 22:03:24.581646', 'r', 'w', NULL, 'Atelier', 'Atelier', 'sur_place', NULL, true, false, false, NULL, 0.00, 0.00, 'atelier', 1000.00);
INSERT INTO public.orders VALUES (24, 'S Q', '077777777', '200000', 'En production', NULL, '2026-03-22 00:01:34.512269', '2026-03-22 00:06:18.844221', 'S', 'Q', NULL, 'Sa├»da', 'Hassasna', 'domicile', NULL, false, false, false, NULL, 1900.00, 0.00, 'admin', 0.00);
INSERT INTO public.orders VALUES (27, 'O P', '0555555', 'Sur place', 'Nouvelle commande', NULL, '2026-03-22 00:20:57.191838', '2026-03-22 00:20:57.191838', 'O', 'P', NULL, 'Atelier', 'Atelier', 'sur_place', NULL, true, false, false, NULL, 0.00, 0.00, 'atelier', 0.00);
INSERT INTO public.orders VALUES (26, 'O U', '077777', 'Sur place', 'R├⌐cup├⌐r├⌐e', NULL, '2026-03-22 00:13:40.200788', '2026-03-22 00:26:00.571554', 'O', 'U', NULL, 'Atelier', 'Atelier', 'sur_place', NULL, true, false, false, NULL, 0.00, 0.00, 'atelier', 0.00);
INSERT INTO public.orders VALUES (28, 'f d', '055555', 'Sur place', 'R├⌐alis├⌐e', NULL, '2026-03-22 00:26:26.745876', '2026-03-22 00:26:40.497944', 'f', 'd', NULL, 'Atelier', 'Atelier', 'sur_place', NULL, true, false, false, NULL, 0.00, 0.00, 'atelier', 0.00);
INSERT INTO public.orders VALUES (25, 'D R', '066666666', '090000', 'Livr├⌐', NULL, '2026-03-22 00:11:44.531621', '2026-03-22 00:28:37.115581', 'D', 'R', NULL, 'Blida', 'Boufarik', 'domicile', NULL, false, false, false, NULL, 2000.00, 0.00, 'admin', 0.00);


--
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.photos VALUES (18, 24, 'https://res.cloudinary.com/dxchqitkp/image/upload/v1774134095/aurea-deco-uploads/dcda0e6dnyn8sqbe73fe.jpg', 'client', 1, '2026-03-22 00:01:36.538941');
INSERT INTO public.photos VALUES (19, 25, 'https://res.cloudinary.com/dxchqitkp/image/upload/v1774134705/aurea-deco-uploads/syjttkqideoy0kh0ulzh.jpg', 'client', 1, '2026-03-22 00:11:45.786769');
INSERT INTO public.photos VALUES (20, 28, 'https://res.cloudinary.com/dxchqitkp/image/upload/v1774135623/aurea-deco-uploads/rxvkb2xydytxuscfqhqu.png', 'designer', 2, '2026-03-22 00:27:04.080282');
INSERT INTO public.photos VALUES (21, 32, 'https://res.cloudinary.com/dxchqitkp/image/upload/v1774386167/aurea-deco-uploads/lnp775rkqawog8k7bq5b.jpg', 'client', 1, '2026-03-24 22:02:47.24005');


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.products VALUES (37, 24, 'Couvre  (Noir)', 2, 2000.00, 'En attente', '2026-03-22 00:01:34.512269', '2026-03-22 00:01:34.512269', NULL);
INSERT INTO public.products VALUES (38, 24, 'Drap  (Rose)', 1, 3000.00, 'En attente', '2026-03-22 00:01:34.512269', '2026-03-22 00:01:34.512269', NULL);
INSERT INTO public.products VALUES (39, 25, 'Couvre  (Noir)', 2, 3000.00, 'En attente', '2026-03-22 00:11:44.531621', '2026-03-22 00:11:44.531621', NULL);
INSERT INTO public.products VALUES (40, 25, 'Couvre (Grenat - 40*40)', 1, 4000.00, 'En attente', '2026-03-22 00:11:44.531621', '2026-03-22 00:11:44.531621', NULL);
INSERT INTO public.products VALUES (41, 26, 'Couvre (Grenat - 40*40)', 1, 3000.00, 'En attente', '2026-03-22 00:13:40.200788', '2026-03-22 00:13:40.200788', NULL);
INSERT INTO public.products VALUES (42, 27, 'Couvre (Grenat - 40*40)', 2, 4000.00, 'En attente', '2026-03-22 00:20:57.191838', '2026-03-22 00:20:57.191838', NULL);
INSERT INTO public.products VALUES (43, 28, 'Couvre (Blue)', 1, 4000.00, 'En attente', '2026-03-22 00:26:26.745876', '2026-03-22 00:26:26.745876', NULL);
INSERT INTO public.products VALUES (46, 31, 'Couvre  (Noir)', 1, 3000.00, 'En attente', '2026-03-22 23:53:54.067447', '2026-03-22 23:53:54.067447', NULL);
INSERT INTO public.products VALUES (47, 31, 'Couvre (Grenat - 40*40)', 1, 4000.00, 'En attente', '2026-03-22 23:53:54.067447', '2026-03-22 23:53:54.067447', NULL);
INSERT INTO public.products VALUES (48, 32, 'Couvre  (Noir)', 1, 2000.00, 'En attente', '2026-03-24 22:02:43.455065', '2026-03-24 22:02:43.455065', NULL);
INSERT INTO public.products VALUES (49, 33, 'Couvre (Blue)', 1, 2000.00, 'En attente', '2026-03-24 22:03:24.581646', '2026-03-24 22:03:24.581646', NULL);


--
-- Data for Name: stock_product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: stock_products; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (1, 'Admin User', 'admin@aurea.dz', '$2a$10$wCb0rTXfrOUwAGV31bYK9OtqLdzUTPZUj0azawpgQjfdqPo7T.2X2', 'admin', '2026-03-06 17:14:31.354132', '2026-03-13 15:51:47.049303');
INSERT INTO public.users VALUES (2, 'Atelier User', 'atelier@aurea.dz', '$2a$10$1hLGmRm5.ip3yBBqBngR3uSkh/smFG.VbOOVgZTM85nYNW0Obv2VW', 'designer', '2026-03-06 17:14:31.360165', '2026-03-13 15:51:47.171152');


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 21, true);


--
-- Name: inventory_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_items_id_seq', 12, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 33, true);


--
-- Name: photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.photos_id_seq', 21, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 49, true);


--
-- Name: stock_product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_product_variants_id_seq', 1, false);


--
-- Name: stock_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_products_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: company_settings company_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_key_key UNIQUE (key);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: stock_product_variants stock_product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_product_variants
    ADD CONSTRAINT stock_product_variants_pkey PRIMARY KEY (id);


--
-- Name: stock_products stock_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_products
    ADD CONSTRAINT stock_products_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_orders_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created ON public.orders USING btree (created_at DESC);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);


--
-- Name: idx_orders_designer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_designer ON public.orders USING btree (assigned_designer);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_photos_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_order ON public.photos USING btree (order_id);


--
-- Name: idx_photos_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_photos_order_id ON public.photos USING btree (order_id);


--
-- Name: idx_products_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_order ON public.products USING btree (order_id);


--
-- Name: idx_products_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_order_id ON public.products USING btree (order_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: company_settings update_company_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inventory_items update_inventory_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stock_products update_stock_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_stock_products_updated_at BEFORE UPDATE ON public.stock_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stock_product_variants update_stock_variants_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_stock_variants_updated_at BEFORE UPDATE ON public.stock_product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders orders_assigned_designer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_assigned_designer_fkey FOREIGN KEY (assigned_designer) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: photos photos_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: photos photos_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: products products_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: stock_product_variants stock_product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_product_variants
    ADD CONSTRAINT stock_product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.stock_products(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict L6Re9GU2iy0uROlZgFolwoQiqziOOhMs7NzIfRARGE5XXklqEORjeNqxLa7pV97

