import React, { useState, useEffect } from 'react';
// import mockUser from './mockData.js/mockUser';
// import mockRepos from './mockData.js/mockRepos';
// import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
    const [githubUser, setGithubUser] = useState({});
    const [repos, setRepos] = useState([]);
    const [followers, setFollowers] = useState([]);

    //request loading
    const [requests, setRequests] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    //err
    const [error, setError] = useState({ show: false, msg: '' })

    const searchGithubUser = async (user) => {
        toggleError()
        setIsLoading(true)
        const response = await axios.get(`${rootUrl}/users/${user}`)
            .catch(err => console.log(err))
        if (response) {
            setGithubUser(response.data)
            const { login, followers_url } = response.data

            await Promise.allSettled(
                [
                    axios.get(`${rootUrl}/users/${login}/repos?per_page=100`),
                    axios.get(`${followers_url}?per_page=100`)
                ]
            )
                .then(results => {
                    console.log(results);
                    const [repo, followers] = results;
                    const status = 'fulfilled';
                    if (repo.status === status) {
                        setRepos(repo.value.data)
                    }
                    if (followers.status === status) {
                        setFollowers(followers.value.data)
                    }
                })
                .catch(err => console.log(err))
        }
        else {
            toggleError(true, "User not found")
        }
        checkRequests()
        setIsLoading(false)
    }

    //check req
    const checkRequests = () => {
        axios.get(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                console.log(data)
                let { rate: { remaining } } = data
                console.log(remaining);
                setRequests(remaining)
                if (remaining === 0) {
                    toggleError(true, 'you have exceed the hourly limit')
                }
            })
            .catch(err => {
                console.log(err);
            })
    }

    const toggleError = (show = false, msg = "") => {
        setError({ show: show, msg: msg })
    }
    //error
    useEffect(() => {
        checkRequests()
    }, [])
    return (
        <GithubContext.Provider value={
            {
                githubUser: githubUser,
                repos: repos,
                followers: followers,
                requests: requests,
                error: error,
                searchGithubUser: searchGithubUser,
                isLoading: isLoading
            }
        }>
            {children}
        </GithubContext.Provider>
    );
}

export { GithubProvider, GithubContext }
