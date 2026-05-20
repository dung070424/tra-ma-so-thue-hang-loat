const axios = require('axios');

const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://masothue.com/",
    "Origin": "https://masothue.com",
    "Cookie": "PHPSESSID=dqp34l2c3fv09ultg7u3ddpqoa; c_code_name=VN; hm=1"
};

async function test() {
    try {
        const randomStr = Math.random().toString(36).substring(7);
        console.log(`Step 1: Fetching token with r = ${randomStr}...`);
        
        const tokenParams = new URLSearchParams();
        tokenParams.append('r', randomStr);
        
        const tokenRes = await axios.post("https://masothue.com/Ajax/Token", 
            tokenParams.toString(), 
            { headers, timeout: 10000 }
        );
        
        console.log("Token Response:", tokenRes.data);
        
        if (tokenRes.data && tokenRes.data.success === 1 && tokenRes.data.token) {
            const token = tokenRes.data.token;
            console.log(`\nStep 2: Searching for tax code 0314446814 with token ${token}...`);
            
            const searchParams = new URLSearchParams();
            searchParams.append('q', '0314446814');
            searchParams.append('token', token);
            searchParams.append('force-search', '0');
            
            const searchRes = await axios.post("https://masothue.com/Ajax/Search",
                searchParams.toString(),
                { headers, timeout: 10000 }
            );
            
            console.log("Search Response:", searchRes.data);
        } else {
            console.log("Failed to get a valid token.");
        }
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

test();
