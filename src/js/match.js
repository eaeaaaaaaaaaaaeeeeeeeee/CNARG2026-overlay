// ============================================================
// CNARG 2026 – Gameplay Overlay (Refactored for new HTML/CSS)
// ============================================================

// SOCKET //////////////////////////////////////////////////////
let socket = new ReconnectingWebSocket("ws://" + location.host + "/ws");
socket.onopen = () => { };
socket.onclose = event => { };
socket.onerror = error => { };

// JSON DATA & MOCK ROSTER /////////////////////////////////////
let beatmapSet = [];
let beatmaps = [];
let seeds = [];
let api = "";

// OBS Websocket
let obs = null;
let obsConfigured = false;
let obsTempState = -1;

// INJECT YOUR JSON ARRAY HERE
const PLAYERS_DB = [
    {
        "id": "c2f75753-7a2f-40a0-aa18-9c9c92e8e15f",
        "nickname": "MARCOS4744G",
        "avatar_url": "https://a.ppy.sh/27525330?1770477153.png",
        "team_id": "dab44ddc-811e-4371-b367-782afc96cf06",
        "created_at": "2026-02-21T17:29:19.982379+00:00",
        "osu_id": 27525330,
        "country_rank": 43,
        "seed": 17,
        "status": "participando",
        "teams": {
            "name": "9th dan",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/9thDan.png"
        }
    },
    {
        "id": "dafdbc57-b590-44df-ab9c-86837998f286",
        "nickname": "VamohManaos",
        "avatar_url": "https://a.ppy.sh/11914892?1760846499.jpeg",
        "team_id": "087dc78c-4baf-423b-9e9a-0d72b7c031af",
        "created_at": "2026-02-21T17:28:53.402237+00:00",
        "osu_id": 11914892,
        "country_rank": 123,
        "seed": 28,
        "status": "participando",
        "teams": {
            "name": "Equipo 12",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "40e37b50-aa78-49a2-8b67-11cdcbf25c5e",
        "nickname": "Oniliex",
        "avatar_url": "https://a.ppy.sh/19951927?1769054415.jpeg",
        "team_id": "0cba1284-d16b-4632-bb5f-5290b73a28ff",
        "created_at": "2026-02-21T17:27:32.845208+00:00",
        "osu_id": 19951927,
        "country_rank": 19,
        "seed": 6,
        "status": "participando",
        "teams": {
            "name": "EmpaDePitusas",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/EmpasDePitusas.png"
        }
    },
    {
        "id": "ae89ee87-01c4-48a6-b5a6-350d8422bb5b",
        "nickname": "MqnKillest",
        "avatar_url": "https://a.ppy.sh/17309414?1672344107.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:28:11.233435+00:00",
        "osu_id": 17309414,
        "country_rank": 163,
        "seed": null,
        "status": "no qualifiers",
        "teams": null
    },
    {
        "id": "aee65a6d-db33-4720-ba7f-5aad4dd66847",
        "nickname": "agusgex",
        "avatar_url": "https://a.ppy.sh/14132796?1771643777.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:26:26.992174+00:00",
        "osu_id": 14132796,
        "country_rank": 13,
        "seed": null,
        "status": "no qualifiers",
        "teams": null
    },
    {
        "id": "8b01f7c9-f116-44b2-baac-58bac1fcd654",
        "nickname": "sewly",
        "avatar_url": "https://a.ppy.sh/37319011?1771541963.jpeg",
        "team_id": "1e599d75-74e5-4af2-b335-f167166ef9a2",
        "created_at": "2026-02-21T17:28:26.381406+00:00",
        "osu_id": 37319011,
        "country_rank": 158,
        "seed": 27,
        "status": "participando",
        "teams": {
            "name": "Equipo 11",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "191c8693-ea56-4382-aaa6-b6226e6989de",
        "nickname": "juan222",
        "avatar_url": "https://a.ppy.sh/13009262?1770752749.jpeg",
        "team_id": "ba75fc3f-e2b9-4695-8c51-8008aa1a7362",
        "created_at": "2026-02-21T17:31:53.28315+00:00",
        "osu_id": 13009262,
        "country_rank": 23,
        "seed": 7,
        "status": "participando",
        "teams": {
            "name": "LG TV",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/equipomental.png"
        }
    },
    {
        "id": "3d6c0861-8ae1-411a-a0c4-a40187fb2f93",
        "nickname": "ami222",
        "avatar_url": "https://a.ppy.sh/32948868?1770752959.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:29:40.843553+00:00",
        "osu_id": 32948868,
        "country_rank": 169,
        "seed": null,
        "status": "no qualifiers",
        "teams": null
    },
    {
        "id": "00d7644f-e438-499d-b70c-8a817b7b6b5a",
        "nickname": "- Lucy",
        "avatar_url": "https://a.ppy.sh/22447212?1753567001.png",
        "team_id": "a0c5655b-ec42-4543-845f-63ce1b4e7ef4",
        "created_at": "2026-02-21T17:24:40.698368+00:00",
        "osu_id": 22447212,
        "country_rank": 83,
        "seed": 5,
        "status": "participando",
        "teams": {
            "name": "Jackinators",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/Jackinatorss.png"
        }
    },
    {
        "id": "9693f41e-0ac0-480d-9dba-d2944965988f",
        "nickname": "joako_loco",
        "avatar_url": "https://a.ppy.sh/13659177?1717812867.jpeg",
        "team_id": "78e72998-1c9b-4a15-8a37-ab52fd3cb7da",
        "created_at": "2026-02-21T17:29:10.55854+00:00",
        "osu_id": 13659177,
        "country_rank": 14,
        "seed": 11,
        "status": "participando",
        "teams": {
            "name": "LOS JOROBA",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/LOSJOROBA.png"
        }
    },
    {
        "id": "9e199757-6e3e-4888-aac3-5f394c967c37",
        "nickname": "ERA Mahiru",
        "avatar_url": "https://a.ppy.sh/24649329?1771006017.jpeg",
        "team_id": "7fec45b1-8a3b-4bba-ad31-ee4b1bc1f656",
        "created_at": "2026-02-21T17:27:23.542069+00:00",
        "osu_id": 24649329,
        "country_rank": 16,
        "seed": 9,
        "status": "participando",
        "teams": {
            "name": "The Wind",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/TheWind.png"
        }
    },
    {
        "id": "47c5ee3f-12e1-4bdd-b940-24aa23ae3493",
        "nickname": "Tanque_",
        "avatar_url": "https://a.ppy.sh/38281084?1766731809.jpeg",
        "team_id": "fea975df-be12-4c96-8717-e548fac934a1",
        "created_at": "2026-02-21T17:32:23.579501+00:00",
        "osu_id": 38281084,
        "country_rank": 84,
        "seed": 31,
        "status": "participando",
        "teams": {
            "name": "Equipo 15",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "08894a28-f6ab-469d-af43-10188de2c955",
        "nickname": "Nioya",
        "avatar_url": "https://a.ppy.sh/24281414?1759818087.jpeg",
        "team_id": "45ae7f76-e47b-459b-94fb-709106a4f497",
        "created_at": "2026-02-21T17:32:28.313589+00:00",
        "osu_id": 24281414,
        "country_rank": 147,
        "seed": 30,
        "status": "participando",
        "teams": {
            "name": "Equipo 14",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "eb60d2c2-2511-4cef-af39-e8ae949528e5",
        "nickname": "[IN]insanity435",
        "avatar_url": "https://a.ppy.sh/18286933?1770180269.jpeg",
        "team_id": "ba75fc3f-e2b9-4695-8c51-8008aa1a7362",
        "created_at": "2026-02-21T17:28:05.117353+00:00",
        "osu_id": 18286933,
        "country_rank": 34,
        "seed": 15,
        "status": "participando",
        "teams": {
            "name": "LG TV",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/equipomental.png"
        }
    },
    {
        "id": "1a99b411-6a79-4f45-9a9e-f2b5a1b8ebe8",
        "nickname": "nefzsto",
        "avatar_url": "https://a.ppy.sh/25896513?1742163249.jpeg",
        "team_id": "51859dff-07f0-40cd-895c-b683a4b3183d",
        "created_at": "2026-02-21T17:27:40.528897+00:00",
        "osu_id": 25896513,
        "country_rank": 6,
        "seed": 12,
        "status": "participando",
        "teams": {
            "name": "J TEAM",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/JTEAM.png"
        }
    },
    {
        "id": "49d01c62-d60f-441c-8bfd-b3f87167013d",
        "nickname": "klawesito",
        "avatar_url": "https://a.ppy.sh/21878135?1771543727.jpeg",
        "team_id": "45ae7f76-e47b-459b-94fb-709106a4f497",
        "created_at": "2026-02-21T17:27:52.187567+00:00",
        "osu_id": 21878135,
        "country_rank": 50,
        "seed": 22,
        "status": "participando",
        "teams": {
            "name": "Equipo 14",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "2961c33a-203b-4706-ae81-6274c5095a48",
        "nickname": "Franch0",
        "avatar_url": "https://a.ppy.sh/36257593?1771562882.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:29:15.165063+00:00",
        "osu_id": 36257593,
        "country_rank": 121,
        "seed": 35,
        "status": "eliminado",
        "teams": null
    },
    {
        "id": "ee780216-25fc-4427-b650-e357e3648a4b",
        "nickname": "poymu",
        "avatar_url": "https://a.ppy.sh/24322678?1740358890.jpeg",
        "team_id": "1e599d75-74e5-4af2-b335-f167166ef9a2",
        "created_at": "2026-02-21T17:32:03.138149+00:00",
        "osu_id": 24322678,
        "country_rank": 81,
        "seed": 19,
        "status": "participando",
        "teams": {
            "name": "Equipo 11",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "f524a2c3-a7b4-4631-8a33-0fcf77f86168",
        "nickname": "SrIvanARGXD",
        "avatar_url": "https://a.ppy.sh/16467458?1769054607.jpeg",
        "team_id": "275d77e5-eb6c-441f-a4fc-5614c3028fc2",
        "created_at": "2026-02-21T17:28:41.186082+00:00",
        "osu_id": 16467458,
        "country_rank": 5,
        "seed": 10,
        "status": "participando",
        "teams": {
            "name": "FurryJack",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/FurryJacks.png"
        }
    },
    {
        "id": "1be1f9ba-fe09-4273-8f88-3920803cac12",
        "nickname": "Alexrd341",
        "avatar_url": "https://a.ppy.sh/33917382?1764716758.jpeg",
        "team_id": "dab44ddc-811e-4371-b367-782afc96cf06",
        "created_at": "2026-02-21T17:28:31.039853+00:00",
        "osu_id": 33917382,
        "country_rank": 133,
        "seed": 25,
        "status": "participando",
        "teams": {
            "name": "9th dan",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/9thDan.png"
        }
    },
    {
        "id": "1e918ccb-3204-4cce-932f-5732951c2fdd",
        "nickname": "rami31yt",
        "avatar_url": "https://a.ppy.sh/25857966?1768755518.png",
        "team_id": "fea975df-be12-4c96-8717-e548fac934a1",
        "created_at": "2026-02-21T17:29:29.689334+00:00",
        "osu_id": 25857966,
        "country_rank": 132,
        "seed": 23,
        "status": "participando",
        "teams": {
            "name": "Equipo 15",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "c7b6e702-2dd1-4f76-a5b4-ab0a3ee28416",
        "nickname": "Panderix",
        "avatar_url": "https://a.ppy.sh/16416045?1736663305.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:32:17.535417+00:00",
        "osu_id": 16416045,
        "country_rank": 371,
        "seed": 38,
        "status": "eliminado",
        "teams": null
    },
    {
        "id": "f74680ba-f387-480c-8dd8-17b46962d95e",
        "nickname": "-hakitsu",
        "avatar_url": "https://a.ppy.sh/25300387?1769364450.png",
        "team_id": "275d77e5-eb6c-441f-a4fc-5614c3028fc2",
        "created_at": "2026-02-21T17:20:34.612145+00:00",
        "osu_id": 25300387,
        "country_rank": 2,
        "seed": 2,
        "status": "participando",
        "teams": {
            "name": "FurryJack",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/FurryJacks.png"
        }
    },
    {
        "id": "28f1850f-d923-4fe6-9f37-a91acb7853d7",
        "nickname": "stoneworm",
        "avatar_url": "https://a.ppy.sh/23410931?1705602547.jpeg",
        "team_id": "78e72998-1c9b-4a15-8a37-ab52fd3cb7da",
        "created_at": "2026-02-21T14:31:57.180087+00:00",
        "osu_id": 23410931,
        "country_rank": 11,
        "seed": 3,
        "status": "participando",
        "teams": {
            "name": "LOS JOROBA",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/LOSJOROBA.png"
        }
    },
    {
        "id": "7936630b-e7ce-44a0-bb40-c346450cdd42",
        "nickname": "Yuna-",
        "avatar_url": "https://a.ppy.sh/16233256?1771274845.jpeg",
        "team_id": "7fec45b1-8a3b-4bba-ad31-ee4b1bc1f656",
        "created_at": "2026-02-21T17:15:06.018071+00:00",
        "osu_id": 16233256,
        "country_rank": 8,
        "seed": 1,
        "status": "participando",
        "teams": {
            "name": "The Wind",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/TheWind.png"
        }
    },
    {
        "id": "3c63d7a1-bd03-46f6-9bff-252ce2551da1",
        "nickname": "Zhadow",
        "avatar_url": "https://a.ppy.sh/22318558?1769356905.png",
        "team_id": "087dc78c-4baf-423b-9e9a-0d72b7c031af",
        "created_at": "2026-02-21T17:27:59.929107+00:00",
        "osu_id": 22318558,
        "country_rank": 27,
        "seed": 20,
        "status": "participando",
        "teams": {
            "name": "Equipo 12",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "e4677a3c-1731-4bb0-95c6-7ee440a42f46",
        "nickname": "yarixd1213",
        "avatar_url": "https://a.ppy.sh/34967088?1770446940.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:28:16.443261+00:00",
        "osu_id": 34967088,
        "country_rank": 185,
        "seed": 36,
        "status": "eliminado",
        "teams": null
    },
    {
        "id": "846de10a-e3d8-4dcc-bb40-0b4c576c4775",
        "nickname": "Bruuno",
        "avatar_url": "https://a.ppy.sh/19799691?1771643510.jpeg",
        "team_id": "84bae014-109a-4f34-a255-b4ad0b0c69cc",
        "created_at": "2026-02-21T17:27:47.195603+00:00",
        "osu_id": 19799691,
        "country_rank": 31,
        "seed": 18,
        "status": "participando",
        "teams": {
            "name": "Peak;Gate",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/PeakGate.png"
        }
    },
    {
        "id": "b5f099ad-5563-479b-ab68-c83d86067d2b",
        "nickname": "Gann4Life",
        "avatar_url": "https://a.ppy.sh/8156589?1769472360.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:28:21.286217+00:00",
        "osu_id": 8156589,
        "country_rank": 1364,
        "seed": 37,
        "status": "eliminado",
        "teams": null
    },
    {
        "id": "3f0a44f3-3d2d-436f-9498-4662db1a7c89",
        "nickname": "Thrushpelt",
        "avatar_url": "https://a.ppy.sh/22174188?1769356554.png",
        "team_id": "8ee20f24-6557-4109-a861-cd6bf8a5be6a",
        "created_at": "2026-02-21T17:26:36.701383+00:00",
        "osu_id": 22174188,
        "country_rank": 25,
        "seed": 8,
        "status": "participando",
        "teams": {
            "name": "The Chosen",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/TheChosen.png"
        }
    },
    {
        "id": "1874b581-b781-4477-babe-8bbe431df660",
        "nickname": "Real_WazaTilina",
        "avatar_url": "https://a.ppy.sh/35527895?1746988142.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:32:12.609061+00:00",
        "osu_id": 35527895,
        "country_rank": 103,
        "seed": null,
        "status": "no qualifiers",
        "teams": null
    },
    {
        "id": "3c42f17b-14a8-467c-a7f2-89649f78e6a2",
        "nickname": "vapy",
        "avatar_url": "https://a.ppy.sh/32546036?1721723760.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:25:57.266451+00:00",
        "osu_id": 32546036,
        "country_rank": 47,
        "seed": null,
        "status": "no qualifiers",
        "teams": null
    },
    {
        "id": "8d058b8c-8d34-4eea-9e7f-6ccc8d5ead0d",
        "nickname": "Santino385",
        "avatar_url": "https://a.ppy.sh/25323939?1770255147.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:32:08.007517+00:00",
        "osu_id": 25323939,
        "country_rank": 198,
        "seed": 33,
        "status": "eliminado",
        "teams": null
    },
    {
        "id": "8ae980c3-a9be-450c-a4f7-74110ab20222",
        "nickname": "Iplaygames13",
        "avatar_url": "https://a.ppy.sh/24253806?1635719508.jpeg",
        "team_id": "0cba1284-d16b-4632-bb5f-5290b73a28ff",
        "created_at": "2026-02-21T17:26:45.078571+00:00",
        "osu_id": 24253806,
        "country_rank": 37,
        "seed": 14,
        "status": "participando",
        "teams": {
            "name": "EmpaDePitusas",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/EmpasDePitusas.png"
        }
    },
    {
        "id": "a69bafcc-2689-49e1-bfb0-ff14eec52355",
        "nickname": "wawa1337",
        "avatar_url": "https://a.ppy.sh/30218532?1770854595.jpeg",
        "team_id": "84bae014-109a-4f34-a255-b4ad0b0c69cc",
        "created_at": "2026-02-21T17:31:59.080373+00:00",
        "osu_id": 30218532,
        "country_rank": 149,
        "seed": 26,
        "status": "participando",
        "teams": {
            "name": "Peak;Gate",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/PeakGate.png"
        }
    },
    {
        "id": "b7d237de-d3cc-4de6-8df9-0ba465505bc0",
        "nickname": "NoirRBK",
        "avatar_url": "https://a.ppy.sh/36375991?1769649948.png",
        "team_id": "dc29df73-b75e-445b-9722-663dac07f307",
        "created_at": "2026-02-21T17:29:35.062999+00:00",
        "osu_id": 36375991,
        "country_rank": 73,
        "seed": 29,
        "status": "participando",
        "teams": {
            "name": "runengoneasypass",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/runengoneasypass.png"
        }
    },
    {
        "id": "8a2b0918-c8b6-4b6d-990d-314535c25e6b",
        "nickname": "Bluetoothhh",
        "avatar_url": "https://a.ppy.sh/25595205?1639321957.jpeg",
        "team_id": null,
        "created_at": "2026-02-21T17:29:25.322224+00:00",
        "osu_id": 25595205,
        "country_rank": 159,
        "seed": 34,
        "status": "eliminado",
        "teams": null
    },
    {
        "id": "c0f8b7c6-b35b-4b9c-b317-aca681dd66ab",
        "nickname": "Hardyest",
        "avatar_url": "https://a.ppy.sh/24675537?1743380087.jpeg",
        "team_id": "8ee20f24-6557-4109-a861-cd6bf8a5be6a",
        "created_at": "2026-02-21T17:29:00.248711+00:00",
        "osu_id": 24675537,
        "country_rank": 68,
        "seed": 16,
        "status": "participando",
        "teams": {
            "name": "The Chosen",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/TheChosen.png"
        }
    },
    {
        "id": "e33f8e80-5ad0-408f-a521-4e95860d1d55",
        "nickname": "Franj323",
        "avatar_url": "https://a.ppy.sh/33382992?1771344953.jpeg",
        "team_id": "dc29df73-b75e-445b-9722-663dac07f307",
        "created_at": "2026-02-21T17:24:50.57648+00:00",
        "osu_id": 33382992,
        "country_rank": 96,
        "seed": 21,
        "status": "participando",
        "teams": {
            "name": "runengoneasypass",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/runengoneasypass.png"
        }
    },
    {
        "id": "e54b6d07-58a9-42fd-a148-40e0e9d7326e",
        "nickname": "Psyche03",
        "avatar_url": "https://a.ppy.sh/27208738?1768270253.png",
        "team_id": "51859dff-07f0-40cd-895c-b683a4b3183d",
        "created_at": "2026-02-21T17:28:35.589201+00:00",
        "osu_id": 27208738,
        "country_rank": 3,
        "seed": 4,
        "status": "participando",
        "teams": {
            "name": "J TEAM",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/JTEAM.png"
        }
    },
    {
        "id": "ea66e867-bbb1-4ca5-ac9f-02c4776882ff",
        "nickname": "Y_Knappe",
        "avatar_url": "https://a.ppy.sh/24170253?1768808008.jpeg",
        "team_id": "a0c5655b-ec42-4543-845f-63ce1b4e7ef4",
        "created_at": "2026-02-21T17:25:51.743555+00:00",
        "osu_id": 24170253,
        "country_rank": 15,
        "seed": 13,
        "status": "participando",
        "teams": {
            "name": "Jackinators",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/Jackinatorss.png"
        }
    },
    {
        "id": "0dc4c0ad-297a-45a8-bc2d-c02e3557a145",
        "nickname": "Derpyx_",
        "avatar_url": "https://a.ppy.sh/36740139?1771371231.png",
        "team_id": "5f7fd351-3804-4c06-8aab-673e232cb87f",
        "created_at": "2026-02-21T17:28:47.462066+00:00",
        "osu_id": 36740139,
        "country_rank": 101,
        "seed": 32,
        "status": "participando",
        "teams": {
            "name": "Equipo 16",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    },
    {
        "id": "13d3dc9c-ac8c-4207-aa04-49ce493b1a6a",
        "nickname": "Nechatron",
        "avatar_url": "https://a.ppy.sh/35160204?1770615552.jpeg",
        "team_id": "5f7fd351-3804-4c06-8aab-673e232cb87f",
        "created_at": "2026-02-21T17:29:05.864327+00:00",
        "osu_id": 35160204,
        "country_rank": 66,
        "seed": 24,
        "status": "participando",
        "teams": {
            "name": "Equipo 16",
            "logo_url": "https://rhyeimfpsnhqqwcfkjuq.supabase.co/storage/v1/object/public/team-logos/no-logo.png"
        }
    }
];

// Database Config - Moved to config.json
let SUPABASE_URL = "";
let SUPABASE_KEY = "";
let supabaseClient = null;

(async () => {
    // Load optional data files (not critical — don't crash if missing)
    try {
        const bsData = await $.getJSON("../_data/beatmaps.json");
        beatmapSet = bsData;
        beatmaps = bsData.map(b => b.beatmapId);
    } catch (e) { console.warn("beatmaps.json not found (non-critical)"); }

    try {
        const sdData = await $.getJSON("../_data/prism_seed.json");
        seeds = sdData;
    } catch (e) { console.warn("prism_seed.json not found (non-critical)"); }

    try {
        const apData = await $.getJSON("../_data/api.json");
        api = apData[0].api;
    } catch (e) { console.warn("api.json not found (non-critical)"); }

    // Stage Name Logic (critical — runs independently)
    try {
        const configData = await $.getJSON("../config.json");

        // Supabase Initialization
        SUPABASE_URL = configData.supabase_url;
        SUPABASE_KEY = configData.supabase_key;
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            global: {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        });

        const stageId = configData.stage_id;
        if (stageId && supabaseClient) {
            const { data: stageData, error } = await supabaseClient
                .from('stages')
                .select('name')
                .eq('id', stageId)
                .single();
            if (!error && stageData) {
                const stageLabel = document.querySelector(".stage");
                if (stageLabel) stageLabel.textContent = stageData.name;
            }
        }

        // Setup OBS WebSocket Connection
        if (configData.obs_ws_url && configData.obs_ws_pwd && window.OBSWebSocket) {
            obs = new OBSWebSocket();
            await obs.connect(configData.obs_ws_url, configData.obs_ws_pwd);
            obsConfigured = true;
            console.log("Connected to OBS WebSocket successfully");
        }
    } catch (e) { console.error("Config or Stage name fetch error:", e); }
})();

// Helper to auto-scale font size if text overflows its container
function adjustFont(element, boundaryWidth, originalFontSize) {
    element.style.fontSize = `${originalFontSize}px`;
    if (element.scrollWidth > boundaryWidth) {
        let newFontSize = (originalFontSize * (boundaryWidth / element.scrollWidth)) * 0.95; // 5% safety margin
        element.style.fontSize = `${newFontSize}px`;
    }
}

// Re-adjust fonts once custom fonts finish loading completely
if (document.fonts) {
    document.fonts.ready.then(() => {
        if (dom.p1Name && dom.p1Name.textContent) adjustFont(dom.p1Name, 450, 42);
        if (dom.p2Name && dom.p2Name.textContent) adjustFont(dom.p2Name, 450, 42);
    });
}

// DOM REFERENCES (New HTML IDs) ///////////////////////////////
const dom = {
    // Map Info
    npTitle: document.getElementById("np-title"),
    npMapper: document.getElementById("np-mapper"),
    npSr: document.getElementById("np-sr"),
    npOd: document.getElementById("np-od"),
    npBpm: document.getElementById("np-bpm"),
    npTime: document.getElementById("np-time"),
    mapMod: document.querySelector(".map-mod"),
    mapBanner: document.querySelector(".map-banner"),

    // Player 1
    p1Name: document.getElementById("p1-name"),
    p1SideName: document.getElementById("p1-side-name"),
    p1Roster: document.getElementById("p1-roster"),
    p1Seed: document.getElementById("p1-seed"),
    p1Avatar: document.getElementById("p1-avatar"),
    p1Score: document.getElementById("p1-score"),

    // Player 2
    p2Name: document.getElementById("p2-name"),
    p2SideName: document.getElementById("p2-side-name"),
    p2Roster: document.getElementById("p2-roster"),
    p2Seed: document.getElementById("p2-seed"),
    p2Avatar: document.getElementById("p2-avatar"),
    p2Score: document.getElementById("p2-score"),

    // Tug of War
    tugBar: document.getElementById("tug-bar"),
    scoreDiff: document.getElementById("score-diff"),

    // Progress Bar
    progresoBar: document.querySelector(".progreso-fill"),

    // Judgements P1
    p1Max: document.getElementById("p1-max"),
    p1300: document.getElementById("p1-300"),
    p1200: document.getElementById("p1-200"),
    p1100: document.getElementById("p1-100"),
    p150: document.getElementById("p1-50"),
    p1Miss: document.getElementById("p1-miss"),

    // Judgements P2
    p2Max: document.getElementById("p2-max"),
    p2300: document.getElementById("p2-300"),
    p2200: document.getElementById("p2-200"),
    p2100: document.getElementById("p2-100"),
    p250: document.getElementById("p2-50"),
    p2Miss: document.getElementById("p2-miss"),

    // Pick Boxes (stars)
    p1PickBox: document.querySelector(".pb-left"),
    p2PickBox: document.querySelector(".pb-right"),

    // Win Screen
    winScreen: document.getElementById("winScreen"),
    winnerName: document.getElementById("winnerName"),
    playerOneFinal: document.getElementById("playerOneFinal"),
    playerTwoFinal: document.getElementById("playerTwoFinal"),
    percentage: document.getElementById("percentage"),
};

// COUNTUP ANIMATION ///////////////////////////////////////////
const countUpOpts = {
    useEasing: true,
    useGrouping: true,
    separator: ",",
    decimal: "."
};

let animScore = {
    p1Score: new CountUp('p1-score', 0, 0, 0, 0.2, countUpOpts),
    p2Score: new CountUp('p2-score', 0, 0, 0, 0.2, countUpOpts),
    scoreDiff: new CountUp('score-diff', 0, 0, 0, 0.2, countUpOpts),
};

// CACHE VARS //////////////////////////////////////////////////
let tempLeft = "";
let tempRight = "";
let bestOfTemp = 0;
let starsLeftTemp = -1;
let starsRightTemp = -1;
let barThreshold = 100000;
let previousState = null;
let cachedScoreLeft = 0;
let cachedScoreRight = 0;

let currentMapId = 0;
let currentMapMod = "NM";

// PICK SYNC (reads state written by MAPPOOL scene) /////////////
window.addEventListener('storage', e => {
    if (e.key !== 'cnarg-pick') return;
    try {
        const { turn, currentPick, phase } = JSON.parse(e.newValue);
        const p1Label = document.querySelector('.pb-left .pick-label');
        const p2Label = document.querySelector('.pb-right .pick-label');
        if (!p1Label || !p2Label) return;

        if (phase === 'picking' && currentPick) {
            if (turn === 0) {
                p1Label.style.color = 'var(--p1)';
                p1Label.textContent = currentPick;
                p2Label.style.color = 'rgba(255,255,255,0.3)';
                p2Label.textContent = 'PICK';
            } else {
                p2Label.style.color = 'var(--p2)';
                p2Label.textContent = currentPick;
                p1Label.style.color = 'rgba(255,255,255,0.3)';
                p1Label.textContent = 'PICK';
            }
        } else {
            p1Label.style.color = '';
            p1Label.textContent = 'PICK';
            p2Label.style.color = '';
            p2Label.textContent = 'PICK';
        }
    } catch (_) { }
});


// HELPER: Parse ms → mm:ss ////////////////////////////////////
const parseTime = ms => {
    const second = Math.floor(ms / 1000) % 60 + '';
    const minute = Math.floor(ms / 1000 / 60) + '';
    return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
};

// ============================================================
// MAIN LOOP
// ============================================================
socket.onmessage = async event => {
    let data = JSON.parse(event.data);
    let manager = data.tourney.manager;
    let gameplay = manager.gameplay;
    let currentState = data.menu?.state;

    // --- AUTO SCENE SWITCHER ---
    if (obsConfigured && obsTempState !== currentState) {
        obsTempState = currentState;
        try {
            let targetScene = "";
            if (currentState === 2) {
                targetScene = "Match"; // Change to your actual OBS MATCH scene name
            } else if (currentState === 7) {
                // targetScene = "CNARG_WINNER"; // Optional: Switch to winner/results after map
            }

            if (targetScene !== "") {
                await obs.call('SetCurrentProgramScene', { sceneName: targetScene });
            }
        } catch (err) { console.error("OBS Switch error:", err); }
    }

    // --- Player Names ---
    // We strictly use:
    // 1. Team Name (h2 titles): From manager.teamName
    // 2. Player Nickname (sidebar labels): From ipcClients (or fallback to manager.teamName)

    let p1Nickname = manager.teamName.left || "";
    let p2Nickname = manager.teamName.right || "";

    if (data.tourney.ipcClients && data.tourney.ipcClients.length >= 2) {
        if (data.tourney.ipcClients[0].spectating.name) p1Nickname = data.tourney.ipcClients[0].spectating.name;
        if (data.tourney.ipcClients[1].spectating.name) p2Nickname = data.tourney.ipcClients[1].spectating.name;
    }

    // Update P1 Side Name (Nickname)
    if (tempLeft !== p1Nickname && p1Nickname) {
        tempLeft = p1Nickname;
        dom.p1SideName.textContent = tempLeft;

        const teamName = manager.teamName.left || tempLeft;
        dom.p1Name.textContent = teamName; // Card title stays as Team Name
        adjustFont(dom.p1Name, 450, 42); // Automatically scale font if the name overflows

        // Fetch team seed & logo from Supabase teams table (using teamName or nickname match)
        (async () => {
            try {
                const { data: teamData } = await supabaseClient
                    .from('teams')
                    .select('seed, logo_url')
                    .eq('name', teamName)
                    .single();
                if (teamData) {
                    dom.p1Seed.textContent = teamData.seed != null ? teamData.seed : "-";
                    if (teamData.logo_url) dom.p1Avatar.style.backgroundImage = `url('${teamData.logo_url}')`;
                }
            } catch (e) { console.error('P1 team fetch error:', e); }
        })();

        renderRoster(dom.p1Roster, teamName, p1Nickname, "active-p1");
    }

    // Update P2 Side Name (Nickname)
    if (tempRight !== p2Nickname && p2Nickname) {
        tempRight = p2Nickname;
        dom.p2SideName.textContent = tempRight;

        const teamName = manager.teamName.right || tempRight;
        dom.p2Name.textContent = teamName; // Card title stays as Team Name
        adjustFont(dom.p2Name, 450, 42); // Automatically scale font if the name overflows

        // Fetch team seed & logo from Supabase teams table
        (async () => {
            try {
                const { data: teamData } = await supabaseClient
                    .from('teams')
                    .select('seed, logo_url')
                    .eq('name', teamName)
                    .single();
                if (teamData) {
                    dom.p2Seed.textContent = teamData.seed != null ? teamData.seed : "-";
                    if (teamData.logo_url) dom.p2Avatar.style.backgroundImage = `url('${teamData.logo_url}')`;
                }
            } catch (e) { console.error('P2 team fetch error:', e); }
        })();

        renderRoster(dom.p2Roster, teamName, p2Nickname, "active-p2");
    }

    // --- Map Info ---
    updateMapDetails(data.menu);

    // --- Scores & Gameplay ---
    if (manager.bools.scoreVisible) {
        updateScore(gameplay.score.left, gameplay.score.right);

        // Judgements
        if (data.tourney.ipcClients && data.tourney.ipcClients.length >= 2) {
            updateJudgements(data.tourney.ipcClients[0].gameplay.hits, "p1");
            updateJudgements(data.tourney.ipcClients[1].gameplay.hits, "p2");
        }
    }

    // --- Progress Bar ---
    try {
        let live = data.menu?.bm?.time?.current || 0;
        let firstObject = data.menu?.bm?.time?.firstObj || 0;
        let lastObject = data.menu?.bm?.time?.mp3 || 0; // Using mp3 as the end time as recommended by the API

        let totalPlayableTime = lastObject - firstObject;
        let currentRelativeTime = live - firstObject;

        let progressPercent = 0;
        if (totalPlayableTime > 0) {
            progressPercent = (currentRelativeTime / totalPlayableTime) * 100;
        }

        let rawPercent = progressPercent; // Save for debug

        // Defensive checks for NaN or Infinity
        if (isNaN(progressPercent) || !isFinite(progressPercent)) {
            progressPercent = 0;
        }

        // Clamping (between 0% and 100%)
        if (progressPercent < 0) progressPercent = 0;
        if (progressPercent > 100) progressPercent = 100;

        dom.progresoBar.style.width = `${progressPercent}%`;

        // DEBUG: Inject raw values into the label so we can see what TOSU is sending live.
        const progText = document.querySelector(".progreso-text");
        if (progText) {
            progText.textContent = `P: ${progressPercent.toFixed(1)}% | Raw: ${rawPercent.toFixed(1)} | L: ${live} | F: ${firstObject} | La: ${lastObject}`;
        }
    } catch (e) {
        console.error('Progress bar error:', e);
        const progText = document.querySelector(".progreso-text");
        if (progText) progText.textContent = "ERR: " + e.message;
    }

    // --- Match Stars (Pick Squares) ---
    updateStars(manager.stars.left, manager.stars.right, manager.bestOF);

    // --- Win Screen (IPC State) ---
    if (previousState !== manager.ipcState) {
        checkState(manager.ipcState);
        previousState = manager.ipcState;
    }
};

// ============================================================
// FUNCTIONS
// ============================================================

// --- Map Details ---
function updateMapDetails(menu) {
    let { id } = menu.bm;
    let fileNm = menu.bm.path.file;
    let { memoryOD, fullSR, BPM: { min, max } } = menu.bm.stats;
    let { full } = menu.bm.time;
    let { artist, title, mapper } = menu.bm.metadata;

    // Supabase logic for Map Badge (RC, HB, LN, SV, TB)
    if (currentMapId !== id && id !== 0) {
        currentMapId = id;
        fetchMapModFromSupabase(id).then(mod => {
            currentMapMod = mod || "FM"; // Fallback
            dom.mapMod.textContent = currentMapMod;
            dom.mapMod.className = `map-mod mod-${currentMapMod}`;
        });
    }

    // Check beatmapSet for HR / DT stats modification
    let customMapper = "";
    let bmData = beatmapSet.find(b => b.beatmapId === id || b.beatmapId === fileNm);
    if (bmData) {
        customMapper = bmData.mappers || "";
        let mod = bmData.pick ? bmData.pick.substring(0, 2).toUpperCase() : currentMapMod;
        if (mod === "HR") {
            memoryOD = Math.min(memoryOD * 1.4, 10).toFixed(2);
        } else if (mod === "DT") {
            memoryOD = Math.min(
                (79.5 - (Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * memoryOD))) / 1.5)) / 6,
                11
            ).toFixed(2);
            full = full / 1.5;
            min = Math.round(min * 1.5);
            max = Math.round(max * 1.5);
            fullSR = bmData.modSR || fullSR;
        }
    }

    // Update DOM
    dom.npTitle.textContent = `${artist} - ${title}`;
    dom.npMapper.textContent = customMapper ? `mapeado por ${customMapper}` : `mapeado por ${mapper}`;
    dom.npSr.textContent = `${parseFloat(fullSR || 0).toFixed(2)}*`;
    dom.npOd.textContent = memoryOD || 0;
    dom.npBpm.textContent = (min === max) ? min : `${min}-${max}`;
    dom.npTime.textContent = parseTime(full);

    // Map banner background
    let bgPath = menu.bm.path.full;
    if (bgPath) {
        bgPath = bgPath.replace(/#/g, '%23');
        bgPath = encodeURI(bgPath).replace(/%25/g, '%');
        dom.mapBanner.style.backgroundImage = `url("http://${location.host}/Songs/${bgPath}")`;
        dom.mapBanner.style.backgroundSize = "cover";
        dom.mapBanner.style.backgroundPosition = "center";
    }
}

async function fetchMapModFromSupabase(bmId) {
    try {
        const res = await axios.get(`${SUPABASE_URL}/rest/v1/mappool_maps`, {
            params: { beatmap_id: `eq.${bmId}`, select: 'pattern_type' },
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (res.data && res.data.length > 0 && res.data[0].pattern_type) {
            return res.data[0].pattern_type.toUpperCase();
        }
    } catch (e) {
        console.error("Error fetching map mod from Supabase:", e);
    }
    return null;
}
// --- Team Details (Logo) from Supabase ---
async function setPlayerDetails(avatarEl, teamName) {
    if (!teamName) return;
    try {
        const res = await axios.get(`${SUPABASE_URL}/rest/v1/teams`, {
            params: { name: `eq.${teamName}`, select: '*' },
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (res.data && res.data.length > 0) {
            const team = res.data[0];
            if (team.logo_url) {
                avatarEl.style.backgroundImage = `url('${team.logo_url}')`;
            }
        }
    } catch (e) {
        console.error("Error fetching team logo:", e);
    }
}

// --- Roster Rendering ---
function renderRoster(container, teamName, activeNickname, activeClass) {
    container.innerHTML = '';
    const roster = PLAYERS_DB.filter(p => p.teams && p.teams.name === teamName);

    // If team not found in DB, just show the active nickname as a single player
    if (roster.length === 0) {
        const span = document.createElement('span');
        span.className = `roster-player ${activeClass}`;
        span.textContent = activeNickname;
        container.appendChild(span);
        return;
    }

    // Render all teammates
    roster.forEach(player => {
        const span = document.createElement('span');
        span.className = 'roster-player';
        if (player.nickname.toLowerCase() === activeNickname.toLowerCase()) {
            span.classList.add(activeClass);
        }
        span.textContent = player.nickname;
        container.appendChild(span);
    });
}

// --- Live Score + Tug of War ---
function updateScore(scoreLeft, scoreRight) {
    // Cache scores for win screen
    cachedScoreLeft = scoreLeft;
    cachedScoreRight = scoreRight;

    // CountUp animations
    animScore.p1Score.update(scoreLeft);
    animScore.p2Score.update(scoreRight);

    let difference = Math.abs(scoreLeft - scoreRight);
    animScore.scoreDiff.update(difference);

    // Tug of War bar: 50% = tied, 100% = P1 max lead, 0% = P2 max lead
    let diff = scoreLeft - scoreRight;
    let percentage = 50 + ((diff / barThreshold) * 50);
    percentage = Math.max(0, Math.min(100, percentage));
    dom.tugBar.style.width = `${percentage}%`;
}

// --- osu!mania Full Judgement Spread ---
function updateJudgements(hits, side) {
    if (!hits) return;
    if (side === "p1") {
        dom.p1Max.textContent = hits.geki || 0;
        dom.p1300.textContent = hits["300"] || 0;
        dom.p1200.textContent = hits.katu || 0;
        dom.p1100.textContent = hits["100"] || 0;
        dom.p150.textContent = hits["50"] || 0;
        dom.p1Miss.textContent = hits["0"] || 0;
    } else {
        dom.p2Max.textContent = hits.geki || 0;
        dom.p2300.textContent = hits["300"] || 0;
        dom.p2200.textContent = hits.katu || 0;
        dom.p2100.textContent = hits["100"] || 0;
        dom.p250.textContent = hits["50"] || 0;
        dom.p2Miss.textContent = hits["0"] || 0;
    }
}

// --- Match Stars (Dynamic Pick Squares) ---
function updateStars(starsLeft, starsRight, bestOf) {
    const needed = Math.ceil(bestOf / 2);

    // Only rebuild if something changed
    if (bestOfTemp === needed && starsLeftTemp === starsLeft && starsRightTemp === starsRight) return;
    bestOfTemp = needed;
    starsLeftTemp = starsLeft;
    starsRightTemp = starsRight;

    // --- P1 squares (left) ---
    dom.p1PickBox.querySelectorAll('.sq').forEach(sq => sq.remove());
    for (let i = 0; i < needed; i++) {
        const sq = document.createElement('div');
        sq.className = 'sq';
        sq.style.background = (i < starsLeft) ? '#f7a858' : 'rgba(255,255,255,0.15)';
        dom.p1PickBox.appendChild(sq);
    }

    // --- P2 squares (right) ---
    dom.p2PickBox.querySelectorAll('.sq').forEach(sq => sq.remove());
    for (let i = 0; i < needed; i++) {
        const sq = document.createElement('div');
        sq.className = 'sq';
        sq.style.background = (i < starsRight) ? '#589ced' : 'rgba(255,255,255,0.15)';
        dom.p2PickBox.appendChild(sq);
    }
}

// --- Win Screen (IPC State Machine) ---
function checkState(ipcState) {
    if (ipcState === 4 && cachedScoreLeft !== cachedScoreRight) {
        // Results screen — show win overlay
        const p1Wins = cachedScoreLeft > cachedScoreRight;

        // Winner name + color
        dom.winnerName.textContent = p1Wins ? tempLeft : tempRight;
        dom.winnerName.style.color = p1Wins ? '#f7a858' : '#589ced';

        // Final scores
        dom.playerOneFinal.textContent = cachedScoreLeft.toLocaleString();
        dom.playerTwoFinal.textContent = cachedScoreRight.toLocaleString();

        // Color: winner white, loser dimmed
        dom.playerOneFinal.style.color = p1Wins ? 'white' : 'rgb(150,150,150)';
        dom.playerTwoFinal.style.color = p1Wins ? 'rgb(150,150,150)' : 'white';

        // Percentage difference
        const winnerScore = p1Wins ? cachedScoreLeft : cachedScoreRight;
        const diff = Math.abs(cachedScoreLeft - cachedScoreRight);
        const ratio = winnerScore > 0 ? (diff / winnerScore) * 100 : 0;
        dom.percentage.textContent = `${ratio.toFixed(2)}%`;

        // Show
        dom.winScreen.classList.add('show-win');
    } else {
        // Any other state — hide win overlay
        dom.winScreen.classList.remove('show-win');
    }
}