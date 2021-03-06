require('chai').should()
const {before, describe, it} = require('mocha')
const ghauth = require('ghauth')
const GitHub = require('github')
const pkg = require('./package.json')
const filenames = require('./lib/filenames')
const authOptions = {
  configName: pkg.name, 
  note: pkg.description,
  scopes: ['repo']
}
let releases
let drafts
let draft

describe('electron-prelease-check', () => {  
  before(function(done) {
    this.timeout(90 * 1000) // allow plenty of time to log in

    ghauth(authOptions, function (err, authData) {
      const github = new GitHub()
      github.authenticate({type: 'token', token: authData.token})
      github.repos.getReleases({owner: 'electron', repo: 'electron'})
        .then(res => {
          releases = res.data
          done()
        })
    })
  })

  it('only one draft exists', () => {
    drafts = releases.filter(release => release.draft)
    drafts.length.should.equal(1)
    draft = drafts[0]
  })

  it('draft is a prerelease', () => {
    draft.prerelease.should.equal(true)
  })

  it('draft has release notes', () => {
    draft.body.should.not.include('placeholder')
    draft.body.length.should.be.above(50)
  })

  it('draft has all required assets', () => {
    const requiredAssets = filenames(draft.tag_name).sort()
    const extantAssets = draft.assets.map(asset => asset.name).sort()
    requiredAssets.length.should.be.above(28)
    requiredAssets.forEach(asset => {
      extantAssets.should.include(asset, `${asset} not found in release assets`)
    })
  })
})